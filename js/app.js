import CONFIG from '../config.js'

async function generateQuiz() {
  const API_URL = `${CONFIG.API_URL}?key=${CONFIG.API_KEY}`
  const prompt = document.getElementById('prompt').value.trim()
  const questionCount = document.getElementById('question-count').value

  document.getElementById('quiz-popup').style.display = 'none'

  if (!prompt) {
    alert('⚠️ Vui lòng nhập chủ đề!')
    return
  }

  const basePrompt = `
    Hãy tạo ${questionCount} câu hỏi trắc nghiệm với chủ đề: "${prompt}".
    Mỗi câu hỏi cần có 4 phương án ABCD. Định dạng JSON như sau:
    [
      {
        "question": "Sự kiện nào đánh dấu mốc quan trọng trong quá trình kết thúc chiến tranh ở Việt Nam sau năm 1975?",
        "options": ["Hiệp định Paris 1973", "Chiến dịch Hồ Chí Minh 1975", "Chiến dịch Điện Biên Phủ 1954", "Hiệp định Genève 1954"],
        "correct_answer": "Chiến dịch Hồ Chí Minh 1975"
      },
      ...
    ]
    Chỉ trả về JSON, không có giải thích gì thêm.
    `

  const requestBody = {
    contents: [{ parts: [{ text: basePrompt }] }]
  }
  document.getElementById('quiz-popup-container').style.display = 'flex'
  document.getElementById('quiz-container').innerHTML = 'Đang tạo câu hỏi... ⏳'
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()
    console.log(data)

    if (data.candidates && data.candidates.length > 0) {
      const rawText = data.candidates[0].content.parts[0].text
      const cleanText = rawText.replace(/\*\*/g, '').trim()
      const jsonMatch = cleanText.match(/```json\n([\s\S]+)\n```/)

      if (jsonMatch) {
        const jsonString = jsonMatch[1]
        let quizData = JSON.parse(jsonString)
        console.log('Quiz nhận được:', quizData)
        const quizId = Date.now()

        const quizContainer = document.getElementById('quiz-container')
        quizContainer.innerHTML = ''
        quizContainer.dataset.quizId = quizId

        const sanitizedQuiz = quizData.map((q) => ({
          question: escapeHTML(q.question),
          options: q.options.map(escapeHTML),
          correct_answer: escapeHTML(q.correct_answer)
        }))

        sanitizedQuiz.forEach((q, index) => displayQuiz(q, index, sanitizedQuiz.length, quizId))

        let quizList = JSON.parse(localStorage.getItem('quizQuestions')) || []
        quizList.push({ id: quizId, title: prompt, questions: sanitizedQuiz })
        localStorage.setItem('quizQuestions', JSON.stringify(quizList))
      } else {
        console.error('Lỗi: API không trả về JSON hợp lệ!')
        document.getElementById('quiz-container').innerText = 'API trả về dữ liệu không đúng định dạng!'
      }
    } else {
      document.getElementById('quiz-container').innerText = '❌ Không thể tạo câu hỏi!'
    }
  } catch (error) {
    console.error('Lỗi API:', error)
    document.getElementById('quiz-container').innerText = '❌ Lỗi khi gọi API!'
  }
}

window.generateQuiz = generateQuiz
