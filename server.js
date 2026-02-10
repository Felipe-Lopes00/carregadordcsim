const express = require('express');
const runCharger = require('./charger');

const app = express();
app.use(express.json());

app.post('/start', async (req, res) => {
  const {
    url,
    cpId = 'CP-CLOUD-01',
    durationSec = 300
  } = req.body;

  try {
    await runCharger({
      url,
      cpId,
      durationMs: durationSec * 1000
    });

    res.json({ status: 'finished' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('🚀 Charger virtual pronto'));
