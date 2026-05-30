export const config = { runtime: 'edge' };
export default (req, res) => res.status(200).json({ ok: 1 });
