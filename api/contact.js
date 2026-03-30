export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, company, message, budget } = req.body;

  // Basic validation
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const NOTION_KEY = process.env.NOTION_TOKEN;
  const NOTION_DB  = '1670465b-f68c-4d02-a401-ee86ee33385b';

  const fullMessage = budget ? `${message}\n\nBudget: ${budget}` : message;
  const today = new Date().toISOString().split('T')[0];

  try {
    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB },
        properties: {
          'Name':      { title:     [{ text: { content: name } }] },
          'Email':     { email:     email },
          'Company':   { rich_text: [{ text: { content: company || '' } }] },
          'Message':   { rich_text: [{ text: { content: fullMessage } }] },
          'Status':    { select:    { name: 'New' } },
          'Submitted': { date:      { start: today } },
        },
      }),
    });

    if (notionRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const err = await notionRes.json();
      console.error('Notion error:', err);
      return res.status(500).json({ error: err.message || 'Notion error' });
    }
  } catch (e) {
    console.error('Server error:', e);
    return res.status(500).json({ error: 'Server error' });
  }
}
