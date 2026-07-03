const complaints = []

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    const { name, phone, email, connectionType, planSpeed, actualSpeed, issue, testResult, city, isp } = req.body || {}

    const complaint = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: name || 'Anonymous',
      phone: phone || '',
      email: email || '',
      connectionType: connectionType || 'Unknown',
      planSpeed: planSpeed || 0,
      actualSpeed: actualSpeed || 0,
      issue: issue || '',
      testResult: testResult || null,
      city: city || '',
      isp: isp || 'Unknown',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    complaints.unshift(complaint)

    console.log(`[COMPLAINT] New from ${complaint.name}`)

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. Our team will contact you soon.',
      complaintId: complaint.id,
    })
    return
  }

  res.status(200).json({ total: complaints.length, complaints: complaints.slice(0, 50) })
}
