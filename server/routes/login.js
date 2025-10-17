const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
    const { pin } = req.body;
    const correctPin = process.env.APP_PIN;

    if (!correctPin) {
        return res.status(500).json({ message: 'PIN no configurado en el servidor.' });
    }

    if (pin === correctPin) {
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ message: 'PIN incorrecto.' });
    }
});

module.exports = router;