function gerarHtmlAvisoPrecos(jsonData) {
  // Obtém os valores do JSON
  const prata = Number(jsonData.rates.XAG.toFixed(2));
  const ouro = Number(jsonData.rates.XAU.toFixed(2));
  const altaPrata = jsonData.info.high_mean_diff_xag;
  const altaOuro = jsonData.info.high_mean_diff_xau;

  // Cria o HTML com base nos valores
  let html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Indicação de Alta de Preços</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
      }
      h1 {
        color: #333;
      }
      .mensagem {
        margin-top: 20px;
        padding: 10px;
        border-radius: 5px;
        background-color: #f4f4f4;
      }
    </style>
    </head>
    <body>
    <h1>Indicação de Alta de Preços</h1>
  `;

  // Verifica se há indicação de alta para prata
  if (altaPrata) {
    html += `
      <div class="mensagem">
        <p>Há indicação de <strong>variação alta</strong> nos preços da <strong>prata</strong>. Valor atual: R$<span style="color: red">${prata}</span></p>
      </div>
    `;
  }

  // Verifica se há indicação de alta para ouro
  if (altaOuro) {
    html += `
      <div class="mensagem">
        <p>Há indicação de <strong>variação alta</strong> nos preços do <strong>ouro</strong>. Valor atual: R$<span style="color: red">${ouro}</span></p>
      </div>
    `;
  }

  // Se não houver indicação de alta para prata ou ouro
  if (!altaOuro) {
    html += `
      <div class="mensagem">
        <p><strong>Não</strong> há indicação de <strong>variação alta</strong> nos preços da <strong>prata</strong>. Valor atual: R$<span style="color: green">${prata}</span></p>
      </div>
    `;
  }

  // Se não houver indicação de alta para prata ou ouro
  if (!altaPrata) {
    html += `
      <div class="mensagem">
        <p><strong>Não</strong> há indicação de <strong>variação alta</strong> nos preços do <strong>ouro</strong>. Valor atual: R$<span style="color: green">${ouro}</span></p>
      </div>
    `;
  }

  // Fecha o HTML
  html += `
    </body>
    </html>
  `;

  return html;
}




// Exemplo de uso
const jsonData = {
  "success": true,
  "base": "BRL",
  "timestamp": 1712082564,
  "rates": {
    "XAG": 4.216850269436439,
    "XAU": 369.0512282707107
  },
  "info": {
    "mean_diff_xag": -0.0011137635232325524,
    "mean_diff_xau": -0.004249402376749703,
    "high_mean_diff_xau": true,
    "high_mean_diff_xag": true
  },
  "expirationTimestamp": 1712082796833
};

const htmlAvisoPrecos = gerarHtmlAvisoPrecos(jsonData);
console.log(htmlAvisoPrecos);


export async function sendEmail(recipient, subject, html_content) {
  const sendGridSecret = JSON.parse(await wixSecretsBackend.getSecret('SendGridSecret'));
  const key = sendGridSecret.key;
  const senderEmail = sendGridSecret.senderEmail;

  sgMail.setApiKey(key);

  const msg = {
      to: recipient,
      from: senderEmail,
      subject: subject,
      html: html_content,
  }

  try {
      const response = await sgMail.send(msg);
      return [response[0].statusCode, response[0].headers];
  } catch (error) {
      console.error(error);
  }
}

// Exemplo de uso
const recipient = 'mayara@ybybank.comm.br'
const subject = 'Indicação de Alta de Preços';
const html_content = htmlAvisoPrecos;