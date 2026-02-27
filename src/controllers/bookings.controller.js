router.get('/services/:id/availability', async (req, res) => {

  const { id } = req.params;
  const { month } = req.query;

  if (!month) {
    return res.status(400).json({ error: 'Mes requerido (YYYY-MM)' });
  }

  try {

    const serviceRes = await pool.query(
      'SELECT scheduling_type FROM services WHERE id = $1',
      [id]
    );

    if (!serviceRes.rows.length) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }

    if (serviceRes.rows[0].scheduling_type !== 'fixed_block') {
      return res.json({ days: [] });
    }

    const startOfMonth = `${month}-01`;
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const availabilityRes = await pool.query(
      `
      SELECT sa.date, sa.time_slot
      FROM service_availability sa
      LEFT JOIN bookings b
        ON b.service_id = sa.service_id
        AND b.date = sa.date
        AND b.time_slot = sa.time_slot
      WHERE sa.service_id = $1
      AND sa.date >= $2
      AND sa.date < $3
      AND sa.active = true
      AND b.id IS NULL
      ORDER BY sa.date, sa.time_slot
      `,
      [id, startOfMonth, endOfMonth]
    );

    const grouped = {};

    availabilityRes.rows.forEach(row => {
      if (!grouped[row.date]) {
        grouped[row.date] = [];
      }

      grouped[row.date].push({
        time: row.time_slot.slice(0,5),
        available: true
      });
    });

    const days = Object.keys(grouped).map(date => ({
      date,
      slots: grouped[date]
    }));

    res.json({ days });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});