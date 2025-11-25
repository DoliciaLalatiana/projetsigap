const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const BASE_URL = process.env.REACT_APP_API_BASE || `http://localhost:${process.env.PORT || 5000}`;
let AGENT_TOKEN = process.env.AGENT_TOKEN || '';
let SEC_TOKEN = process.env.SEC_TOKEN || '';

const AGENT_USER = process.env.AGENT_USER || 'agent004';
const AGENT_PASS = process.env.AGENT_PASS || 'Zahoavao2';
const SEC_USER = process.env.SEC_USER || '';
const SEC_PASS = process.env.SEC_PASS || '';

const IMG1 = process.env.IMG1 || path.join(__dirname, '..', 'test_media', 'img1.jpg');
const IMG2 = process.env.IMG2 || path.join(__dirname, '..', 'test_media', 'img2.jpg');

async function loginUser(username, password) {
  const resp = await axios.post(`${BASE_URL}/api/auth/login`, { username, password }, { validateStatus: () => true });
  if (resp.status >= 400) throw new Error(`Login failed: ${resp.status} ${JSON.stringify(resp.data)}`);
  return resp.data.token || resp.data.accessToken || resp.data.access_token || resp.data.jwt || '';
}

async function ensureTokens() {
  if (!AGENT_TOKEN) {
    console.log('Obtention token agent via credentials...');
    AGENT_TOKEN = await loginUser(AGENT_USER, AGENT_PASS);
    console.log('Agent token obtenu.');
  }
  if (!SEC_TOKEN) {
    if (SEC_USER && SEC_PASS) {
      console.log('Obtention token secrétaire via credentials...');
      SEC_TOKEN = await loginUser(SEC_USER, SEC_PASS);
      console.log('Secrétaire token obtenu.');
    } else {
      // FALLBACK: reuse agent token for secretary actions (use only for testing)
      console.warn('SEC_TOKEN absent et pas de SEC_USER/SEC_PASS fournis — fallback: utiliser token agent (peut échouer si rôle requis).');
      SEC_TOKEN = AGENT_TOKEN;
    }
  }
}

async function submitPending() {
  const fd = new FormData();
  fd.append('lot', 'Lot Test 99');
  fd.append('quartier', 'Centre Test');
  fd.append('ville', 'Tana');
  fd.append('fokontany', 'Fok1');
  fd.append('lat', '-18.9301');
  fd.append('lng', '47.5228');
  fd.append('residents', JSON.stringify([{ nom_complet: 'Jean Tester', telephone: '0341234567' }]));
  if (fs.existsSync(IMG1)) fd.append('photos[]', fs.createReadStream(IMG1));
  if (fs.existsSync(IMG2)) fd.append('photos[]', fs.createReadStream(IMG2));

  const headers = { ...fd.getHeaders(), Authorization: `Bearer ${AGENT_TOKEN}` };
  const url = `${BASE_URL}/api/residences`;
  const resp = await axios.post(url, fd, { headers, validateStatus: () => true });
  if (resp.status >= 400) throw new Error(`Erreur soumission pending: ${resp.status} ${JSON.stringify(resp.data)}`);
  return resp.data.pending_id || resp.data.id || resp.data;
}

async function approvePending(pendingId) {
  const url = `${BASE_URL}/api/pending_residences/${pendingId}/approve`;
  const resp = await axios.post(url, { review_notes: 'Test OK' }, { headers: { Authorization: `Bearer ${SEC_TOKEN}` }, validateStatus: () => true });
  if (resp.status >= 400) throw new Error(`Erreur approuver pending: ${resp.status} ${JSON.stringify(resp.data)}`);
  return resp.data.residence?.id || resp.data;
}

(async () => {
  try {
    await ensureTokens();
    if (!AGENT_TOKEN) throw new Error('AGENT_TOKEN introuvable.');
    if (!SEC_TOKEN) throw new Error('SEC_TOKEN introuvable.');

    const pending = await submitPending();
    const pendingId = pending?.id || pending?.pending_id || pending;
    if (!pendingId) throw new Error('Aucun pending_id retourné');

    console.log('Pending créé id=', pendingId);
    const resId = await approvePending(pendingId).catch(e => { throw e; });
    console.log('Approbation réponse residence id=', resId);
    console.log('Test terminé.');
    process.exit(0);
  } catch (err) {
    console.error('Erreur script:', err.message || err);
    process.exit(1);
  }
})();