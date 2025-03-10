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

function displayQuiz(questionObj, index, totalQuestions, quizId, isSavedQuiz = false) {
  const quizContainer = document.getElementById('quiz-container')

  const quizItem = document.createElement('div')
  quizItem.classList.add('quiz-item')
  quizItem.dataset.correctAnswer = questionObj.correct_answer
  quizItem.innerHTML = `<h4>${index + 1}. ${questionObj.question}</h4>`

  questionObj.options.forEach((option, i) => {
    const optionLabel = String.fromCharCode(65 + i)
    const inputId = `question${index}-${i}-${quizId}`

    quizItem.innerHTML += `
          <label for="${inputId}">
              <input type="radio" id="${inputId}" name="question${index}" value="${option}" disabled>
              ${optionLabel}. ${option}
          </label><br>`
  })

  quizContainer.appendChild(quizItem)

  if (index === totalQuestions - 1) {
    setTimeout(() => loadQuizProgress(quizId), 100)
  }
  if (!isSavedQuiz && index === totalQuestions - 1) {
    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'quiz-buttons'

    const regenerateButton = document.createElement('button')
    regenerateButton.textContent = 'Re-generate'
    regenerateButton.onclick = () => {
      let savedQuizzes = JSON.parse(localStorage.getItem('quizQuestions')) || []
      savedQuizzes = savedQuizzes.filter((quiz) => quiz.id != quizId)
      localStorage.setItem('quizQuestions', JSON.stringify(savedQuizzes))
      document.getElementById('quiz-container').innerHTML = ''
      generateQuiz()
    }
    const confirmButton = document.createElement('button')
    confirmButton.textContent = 'Confirm'
    confirmButton.onclick = enableQuiz

    buttonContainer.appendChild(regenerateButton)
    buttonContainer.appendChild(confirmButton)
    quizContainer.appendChild(buttonContainer)
  }
  quizContainer.addEventListener('change', () => saveQuizProgress(quizId))
}

function escapeHTML(text) {
  if (typeof text !== 'string') return text
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

window.generateQuiz = generateQuiz
window.displayQuiz = displayQuiz
