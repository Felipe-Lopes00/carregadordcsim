const WebSocket = require('ws');

module.exports = async function runCharger({ url, cpId, durationMs }) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${url}/${cpId}`, {
      headers: { 'Sec-WebSocket-Protocol': 'ocpp1.6' }
    });

    let msgId = 1;
    let transactionId;

    function call(action, payload) {
      ws.send(JSON.stringify([2, `${msgId++}`, action, payload]));
    }

    ws.on('open', () => {
      call('BootNotification', {
        chargePointVendor: 'CloudRun',
        chargePointModel: 'Virtual-22kW'
      });
    });

    ws.on('message', data => {
      const msg = JSON.parse(data);

      if (msg[0] === 3) {
        const payload = msg[2];

        if (payload.status === 'Accepted' && payload.currentTime) {
          call('StartTransaction', {
            connectorId: 1,
            idTag: 'CLOUD',
            meterStart: 0,
            timestamp: new Date().toISOString()
          });
        }

        if (payload.transactionId) {
          transactionId = payload.transactionId;

          const meterTimer = setInterval(() => {
            call('MeterValues', {
              connectorId: 1,
              transactionId,
              meterValue: [{
                timestamp: new Date().toISOString(),
                sampledValue: [{
                  measurand: 'Power.Active.Import',
                  unit: 'kW',
                  value: (18 + Math.random() * 4).toFixed(1)
                }]
              }]
            });
          }, 10000);

          setTimeout(() => {
            clearInterval(meterTimer);
            call('StopTransaction', {
              transactionId,
              meterStop: 12000,
              timestamp: new Date().toISOString(),
              reason: 'EVDisconnected'
            });
            ws.close();
            resolve();
          }, durationMs);
        }
      }
    });

    ws.on('error', reject);
  });
};
