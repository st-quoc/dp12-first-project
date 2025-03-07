import CONFIG from '../config.js'

async function generateQuiz() {
  const apiUrl = `${CONFIG.API_URL}?key=${CONFIG.API_KEY}`
  const topic = document.getElementById('topicInput').value.trim()
  const questionCountInput = document.getElementById('questionCountInput').value.trim() // Lấy giá trị số câu hỏi từ input

  const questionCount = parseInt(questionCountInput, 10) // Chuyển thành số nguyên

  if (!topic) {
    alert('Vui lòng nhập chủ đề!')
    return
  }
  if (isNaN(questionCount) || questionCount < 1 || questionCount > 10) {
    alert('Vui lòng nhập số lượng câu hỏi từ 1 đến 10!')
    return
  }

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Generate ${questionCount} multiple-choice questions about ${topic}. 
                    Each question should have 4 options (A, B, C, D). No explain for answer`
          }
        ]
      }
    ]
  }

  document.getElementById('result').innerHTML = '⏳ Đang tạo đề...'

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!data.candidates || !data.candidates[0].content.parts[0].text) {
      throw new Error('Kết quả trả về không hợp lệ!')
    }

    const resultText = data.candidates[0].content.parts[0].text
    document.getElementById('result').innerHTML = formatQuestions(resultText)
  } catch (error) {
    document.getElementById('result').innerHTML = '❌ Lỗi khi gọi API hoặc xử lý dữ liệu.'
    console.error('Lỗi chi tiết:', error)
  }
}

function formatQuestions(rawText) {
  return rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
}

window.generateQuiz = generateQuiz
