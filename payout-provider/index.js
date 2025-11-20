
const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

const PORT = 5002;

// Endpoint called by the Backend to trigger a payout
app.post('/payout/execute', (req, res) => {
    const { transferId, amount, currency, webhookUrl } = req.body;
    console.log(`[Bank] Processing Payout: ${amount} ${currency} for Transfer ${transferId}`);

    // 1. Acknowledge the request immediately
    res.status(200).json({
        message: 'Payout Queued',
        queueId: `Q_${Date.now()}`
    });

    // 2. Simulate Banking Network Delay (5 seconds)
    setTimeout(async () => {
        try {
            const payoutRef = `BANK_REF_${Date.now()}`;
            console.log(`[Bank] Payout Successful. Sending Webhook to ${webhookUrl}`);
            console.log(`[Bank] Payload: { transferId: '${transferId}', payoutRef: '${payoutRef}', status: 'SUCCESS' }`);
            
            // 3. Send Webhook to Backend
            await axios.post(webhookUrl, {
                transferId: transferId,
                payoutRef: payoutRef, // Requirement: Must match backend controller expectation
                status: 'SUCCESS'
            });
        } catch (err) {
            console.error('[Bank] Webhook Delivery Failed:', err.message);
        }
    }, 5000);
});

app.listen(PORT, () => {
    console.log(`Payout Mock Server running on port ${PORT}`);
});