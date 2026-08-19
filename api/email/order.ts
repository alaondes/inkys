import nodemailer from "nodemailer";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
  } catch (error: any) {
    const isAuthError = error?.code === 'EAUTH' || error?.message?.includes('535') || error?.message?.includes('Username and Password not accepted');
    if (isAuthError) {
      console.warn("SMTP Authentication warning: GMAIL_USER or GMAIL_PASS credentials are not accepted by Google SMTP. E-mail was skipped. Generate a Google App Password to resolve this.");
      res.json({ success: false, warning: "SMTP authentication failed. Verify GMAIL_USER and GMAIL_PASS." });
    } else {
      console.error("Error sending email:", error);
      res.status(500).json({ error: "Failed to send email" });
    }
  }
}
