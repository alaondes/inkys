import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/email/order", async (req, res) => {
    const { order, customerEmail } = req.body;
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn("GMAIL_USER or GMAIL_PASS environment variables are not set. Cannot send email.");
      return res.status(500).json({ error: "Email credentials not configured" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      // Format items
      const itemsHtml = order.items.map((item: any) => {
        const itemName = item.name || (item.product && item.product.name) || 'Produto desconhecido';
        const itemPrice = Number(item.price || (item.product && item.product.price) || 0);
        const itemImage = item.image || (item.product && item.product.image) || '';
        const imageTag = itemImage ? `<img src="${itemImage}" alt="${itemName}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; margin-right: 15px;" />` : '';
        return `<li style="display: flex; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
              ${imageTag}
              <div>
                <div style="font-weight: bold; margin-bottom: 4px;">${item.quantity}x ${itemName}</div>
                <div style="color: #666; font-size: 14px;">R$ ${itemPrice.toFixed(2)}</div>
              </div>
            </li>`;
      }).join("");

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Novo Pedido #${order.id || 'Pendente'}</h2>
          <p>Olá ${order.customer},</p>
          <p>Recebemos o seu pedido com sucesso! Aqui estão os detalhes:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Resumo do Pedido</h3>
            <ul style="list-style-type: none; padding: 0; margin: 15px 0;">
              ${itemsHtml}
            </ul>
            <p><strong>Total: R$ ${order.total.toFixed(2)}</strong></p>
          </div>
          
          <h3 style="margin-top: 20px;">Informações de Entrega</h3>
          <p>
            Email: ${order.shippingInfo?.email || 'Não informado'}<br>
            Telefone: ${order.phone || 'Não informado'}<br>
            Endereço: ${order.shippingInfo?.address || 'Retirada na loja'}
          </p>

          <p style="margin-top: 30px; font-size: 12px; color: #777;">
            Este é um email automático. Por favor, não responda.
          </p>
        </div>
      `;

      // Email to the customer
      if (customerEmail) {
        await transporter.sendMail({
          from: `"Inkys" <${process.env.GMAIL_USER}>`,
          to: customerEmail,
          subject: `Confirmação do Pedido Inkys`,
          html: emailHtml,
        });
      }

      // Email to the store
      await transporter.sendMail({
        from: `"Inkys (Sistema)" <${process.env.GMAIL_USER}>`,
        to: "inkysbr@gmail.com",
        subject: `Novo Pedido de ${order.customer} (${order.id || 'Pendente'})`,
        html: emailHtml,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  app.post("/api/email/status-update", async (req, res) => {
    const { order, customerEmail, status, trackingCode } = req.body;
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      console.warn("GMAIL_USER or GMAIL_PASS environment variables are not set. Cannot send email.");
      return res.status(500).json({ error: "Email credentials not configured" });
    }

    if (!customerEmail) {
      return res.status(400).json({ error: "Customer email missing" });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASS,
        },
      });

      let subject = "";
      let title = "";
      let bodyHtml = "";

      const orderId = order.id || 'Pendente';

      switch (status) {
        case 'paid':
          subject = `Pagamento Confirmado e Recibo! Pedido #${orderId}`;
          title = `Oba! Recebemos o seu pagamento! 🎉`;
          bodyHtml = `
            <p>O pagamento do seu pedido foi confirmado com sucesso.</p>
            <p>Seu pedido agora entrou na fase de produção e separação. Em breve ele estará a caminho!</p>
            
            <div style="margin-top: 25px; padding: 20px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #0f172a; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">RECIBO DE PAGAMENTO</h3>
              <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Cliente:</strong> ${order.customer || 'Não informado'}</p>
              <p><strong>Referente a:</strong> Pedido #${orderId}</p>
              <p><strong>Valor Recebido:</strong> R$ ${Number(order.total || 0).toFixed(2)}</p>
              <p><strong>Status:</strong> PAGO</p>
              <br>
              <p style="text-align: center; margin-bottom: 0; color: #475569; font-style: italic;">Inkys - Comprovante gerado eletronicamente</p>
            </div>
          `;
          break;
        case 'shipped':
          subject = `Seu pedido está a caminho! Pedido #${orderId}`;
          title = `Oba, seu pedido foi enviado! 🚚`;
          bodyHtml = `
            <p>Seu pedido acabou de ser despachado e já está a caminho do seu endereço.</p>
            ${trackingCode ? `<div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; border: 1px solid #bbf7d0; margin: 20px 0;"><p style="margin: 0; color: #166534; font-weight: bold;">Código de Rastreio: ${trackingCode}</p></div>` : ''}
            <p>Agradecemos pela preferência!</p>
          `;
          break;
        case 'cancelled':
          subject = `Pedido Cancelado - Pedido #${orderId}`;
          title = `Pedido Cancelado 😔`;
          bodyHtml = `
            <p>Infelizmente, o seu pedido foi cancelado.</p>
            <p>Se isso ocorreu devido a um problema no pagamento (falha no PIX ou Cartão), você pode tentar refazer a compra no nosso site.</p>
            <p>Caso tenha dúvidas sobre estornos ou precise de ajuda, entre em contato conosco.</p>
          `;
          break;
        case 'pending':
          subject = `Lembrete de Pagamento - Pedido #${orderId}`;
          title = `Lembrete de Pagamento ⏳`;
          bodyHtml = `
            <p>Notamos que o seu pedido ainda está aguardando pagamento.</p>
            <p>Se você escolheu pagar via PIX, lembre-se de que a chave expira. Caso tenha esquecido, por favor, realize o pagamento para garantirmos os seus produtos.</p>
            <p>Se você já pagou, pode desconsiderar este e-mail (a confirmação pode levar alguns minutinhos).</p>
          `;
          break;
        default:
          return res.status(400).json({ error: "Invalid status" });
      }

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #111827;">${title}</h2>
          <p>Olá ${order.customer || 'Cliente'},</p>
          ${bodyHtml}
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #555;">
            <p><strong>Resumo do Pedido #${orderId}:</strong></p>
            <p>Total: R$ ${Number(order.total || 0).toFixed(2)}</p>
          </div>
          <p style="margin-top: 40px; font-size: 12px; color: #9ca3af;">
            Este é um email automático de Inkys. Por favor, não responda.
          </p>
        </div>
      `;

      await transporter.sendMail({
        from: `"Inkys" <${process.env.GMAIL_USER}>`,
        to: customerEmail,
        subject: subject,
        html: emailHtml,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending status update email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();