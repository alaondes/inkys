import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { order, customerEmail } = req.body;
  
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY environment variable is not set. Cannot send email.");
    return res.status(500).json({ error: "Email credentials not configured" });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });

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
        from: \`"Inkys" <pedidos@inkys.com.br>\`,
        to: customerEmail,
        subject: \`Confirmação do Pedido Inkys\`,
        html: emailHtml,
      });
    }

    // Email to the store
    await transporter.sendMail({
      from: \`"Inkys Site" <pedidos@inkys.com.br>\`,
      to: "inkysbr@gmail.com", // Seu email que vai receber os avisos
      subject: \`Novo Pedido de \${order.customer} (\${order.id || 'Pendente'})\`,
      html: emailHtml,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
}
