import sgMail from '@sendgrid/mail';
import { readFile } from 'fs/promises';

async function gerarHtmlAvisoPrecos(jsonData) {
  let subject = '🚨 ** Valor Instavel ** 🚨';
  // Obtém os valores do JSON
  const prata = Number(jsonData.rates.XAG.toFixed(2));
  const ouro = Number(jsonData.rates.XAU.toFixed(2));
  const Pratadiff = (jsonData.info.mean_diff_xag.toFixed(2));
  const Ourodiff = (jsonData.info.mean_diff_xau.toFixed(2));
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
    if (jsonData.info.mean_diff_xag > 1) {
      subject = `🚨 **Valor Subiu da Prata R$${prata}** 🚨`;
    } if (jsonData.info.mean_diff_xag < -1 ) {
      subject = `🚨 **Valor Desceu da Prata R$${prata}** 🚨`;
    }
    html += `
      <div class="mensagem">
        <p>Há indicação de <strong>variação alta</strong> nos preços da <strong>prata</strong>. Valor atual: R$<span style="color: red">${prata}</span> Porcentagem da mudança ${Pratadiff}%</p>
      </div>
    `;
  }

  // Verifica se há indicação de alta para ouro
  if (altaOuro) {
    if (jsonData.info.mean_diff_xau > 1) {
      subject = `🚨 **Valor Subiu do Ouro R$${ouro}** 🚨`;
    } if (jsonData.info.mean_diff_xau < -1 ) {
      subject = `🚨 **Valor Desceu do Ouro R$${ouro}** 🚨`;
    }
    html += `
      <div class="mensagem">
        <p>Há indicação de <strong>variação alta</strong> nos preços do <strong>ouro</strong>. Valor atual: R$<span style="color: red">${ouro}</span> Porcentagem da mudança ${Ourodiff}%</p>
      </div>
    `;
  }

  // Se não houver indicação de alta para prata ou ouro
  if (!altaOuro) {
    html += `
      <div class="mensagem">
        <><strong>Não</strong> há indicação de <strong>variação alta</strong> nos preços da <strong>prata</strong>. Valor atual: R$<span style="color: green">${prata}</span> Porcentagem da mudança ${Pratadiff}%</p>
      </div>
    `;
  }

  // Se não houver indicação de alta para prata ou ouro
  if (!altaPrata) {
    html += `
      <div class="mensagem">
        <p><strong>Não</strong> há indicação de <strong>variação alta</strong> nos preços do <strong>ouro</strong>. Valor atual: R$<span style="color: green">${ouro}</span> Porcentagem da mudança ${Ourodiff}%</p> 
      </div>
    `;
  }

  // Fecha o HTML
  html += `
    </body>
    </html>
  `;

  return {html, subject};
}

export async function sendEmail(recipients, subject, html_content) {
  try {
    const sendGridKeys = JSON.parse(await readFile('src/configs/sendGridKeys.json'));
    const { key, senderEmail } = sendGridKeys;

    sgMail.setApiKey(key);

    const msg = {
      to: recipients,
      from: senderEmail,
      subject: subject,
      html: html_content,
    };

    try {
      // Your code to send the email
      const response = await sgMail.send(msg);
      return [response[0].statusCode, response[0].headers];
    } catch (error) {
      console.error("SendGrid API Error:", error.response.body.errors);
      throw error; // Rethrow the error to propagate it further if needed
    }
  } catch (error) {
    console.error("Error reading SendGrid keys:", error);
    throw error; // Rethrow the error to propagate it further if needed
  }
}

export async function sendAlarmEmail(jsonData) {
  try {
    const { html, subject } = await gerarHtmlAvisoPrecos(jsonData);
    await sendEmail(["contato@ybybank.com.br"], subject, html);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}