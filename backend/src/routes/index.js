const express = require('express');
const router = express.Router();

router.use('/users', require('./users'));
router.use('/applications', require('./applications'));

router.get('/', (req, res) => res.json({ ok: true }));

module.exports = router;
