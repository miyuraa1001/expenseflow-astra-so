// api/proxy.js - Vercel Serverless Function Proxy untuk Google Apps Script (GAS)

export default async function handler(req, res) {
  // 1. Atur Header CORS agar frontend dapat memanggil endpoint ini
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Tangani preflight OPTIONS request dari browser
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Ambil URL Web App GAS dan Secret Token
  // Prioritas 1: Ambil dari Environment Variables Vercel (Paling Aman)
  // Prioritas 2: Ambil dari body / query client jika dikirim manual
  const gasWebAppUrl = process.env.GAS_WEBAPP_URL || req.body?.endpointUrl || req.query?.endpointUrl;
  const gasSecretToken = process.env.GAS_SECRET_TOKEN || req.body?.token || req.query?.token;

  if (!gasWebAppUrl) {
    return res.status(400).json({
      status: 'error',
      message: 'GAS Web App URL belum dikonfigurasi. Atur di Environment Variables Vercel atau kirim endpointUrl.'
    });
  }

  try {
    if (req.method === 'GET') {
      // Forward request GET ke Google Apps Script (misal: action=GET_TRANSACTIONS)
      const queryParams = new URLSearchParams(req.query);
      if (gasSecretToken && !queryParams.has('token')) {
        queryParams.append('token', gasSecretToken);
      }

      const targetUrl = `${gasWebAppUrl}?${queryParams.toString()}`;
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow' // Wajib follow redirect 302 Google Script
      });

      const data = await response.json();
      return res.status(response.status).json(data);

    } else if (req.method === 'POST') {
      // Forward request POST ke Google Apps Script
      let payload = req.body;

      // Jika payload berupa objek JS, sertakan token rahasia secara otomatis
      if (typeof payload === 'object' && payload !== null) {
        if (gasSecretToken && !payload.token) {
          payload.token = gasSecretToken;
        }
      }

      const response = await fetch(gasWebAppUrl, {
        method: 'POST',
        headers: {
          // Google Apps Script menerima text/plain dengan baik tanpa preflight blocking
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: typeof payload === 'string' ? payload : JSON.stringify(payload),
        redirect: 'follow'
      });

      const responseText = await response.text();
      try {
        const data = JSON.parse(responseText);
        return res.status(response.status).json(data);
      } catch {
        // Fallback jika GAS mengembalikan text non-JSON
        return res.status(200).send(responseText);
      }

    } else {
      return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Proxy Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghubungi Google Apps Script: ' + error.message
    });
  }
}
