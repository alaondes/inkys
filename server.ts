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
      const itemsHtml = order.items.map((item: any) => 
        `<li>${item.quantity}x ${item.product.name} (R$ ${item.product.price.toFixed(2)})</li>`
      ).join("");

      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Novo Pedido #${order.id || 'Pendente'}</h2>
          <p>Olá ${order.customer},</p>
          <p>Recebemos o seu pedido com sucesso! Aqui estão os detalhes:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Resumo do Pedido</h3>
            <ul>
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