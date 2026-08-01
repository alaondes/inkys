import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
}
