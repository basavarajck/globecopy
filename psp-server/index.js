
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');

// Try to load .env from parent directory for shared config
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const app = express();
app.use(express.json());

const PORT = 5001;
const PSP_SECRET = process.env.PSP_SECRET || 'psp_secret_key';

app.post('/psp/pay', (req, res) => {
    const { transferId, amount, currency, webhookUrl } = req.body;
    console.log(`[PSP] Processing Payment: ${amount} ${currency} for ${transferId}`);

    // Respond immediately to the user/backend
    res.status(200).json({
        message: 'Payment Initiated',
        transactionId: `PSP_TX_${Date.now()}`,
        status: 'PENDING'
    });

    // Simulate Asynchronous processing delay (3 seconds)
    setTimeout(async () => {
        try {
            const status = 'SUCCESS';
            
            // Generate Signature
            const hmac = crypto.createHmac('sha256', PSP_SECRET);
            hmac.update(`${transferId}${status}`);
            const signature = hmac.digest('hex');

            console.log(`[PSP] Sending Webhook to ${webhookUrl}`);
            
            await axios.post(webhookUrl, {
                transferId,
                pspTransactionId: `PSP_REF_${Date.now()}`,
                status,
                signature
            });
        } catch (err) {
            console.error('[PSP] Webhook Failed:', err.message);
        }
    }, 3000);
});

app.listen(PORT, () => {
    console.log(`PSP Mock Server running on port ${PORT}`);
});