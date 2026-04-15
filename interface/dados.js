const API_URL = 'http://localhost:3001/events'

// elementos
const statusRunning = document.getElementById('b_ativo')
const statusSleep = document.getElementById('b_desativado')

const taxaEl = document.getElementById('server_dd_taxa')     
const statusEl = document.getElementById('server_dd_status') 
const logTimeEl = document.getElementById('server_dd_log')   

const vermelhoEl = document.getElementById('contagem_p_v')     
const pretoEl = document.getElementById('contagem_p_pre')      
const prataEl = document.getElementById('contagem_p_prat')     

const logListEl = document.getElementById('mensagem_s')

// conexão SSE
const source = new EventSource(API_URL)

// logs
let lastLogs = []

// 🔢 CONTADORES POR RAMPA (NOVO)
let countRampa1 = 0
let countRampa2 = 0
let countRampa3 = 0

// controle para não contar repetido
let lastStatusRobo = ""

// 🟢 STATUS DO SERVIDOR
let timeoutServidor = null

function servidorAtivo() {
  statusEl.textContent = "SERVIDOR ATIVO"

  if (timeoutServidor) clearTimeout(timeoutServidor)

  timeoutServidor = setTimeout(() => {
    statusEl.textContent = "SERVIDOR INATIVO"
  }, 3000)
}

// horário
function updateLastLogTime() {
  const time = new Date().toLocaleTimeString()
  logTimeEl.textContent = time
}

// logs na tela
function updateLogList() {
  logListEl.innerHTML = lastLogs
    .map(log => `<div style="border-bottom:1px solid #ccc; padding:4px 0;">${log}</div>`)
    .join('')
}

// conexão aberta
source.onopen = () => {
  const time = new Date().toLocaleTimeString()

  lastLogs.unshift(`[${time}] Conectado`)
  if (lastLogs.length > 3) lastLogs.pop()

  updateLastLogTime()
  updateLogList()
}

// recebendo dados
source.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data)
    console.log('Dados recebidos:', data)

    // 🔥 STATUS DO SERVIDOR
    servidorAtivo()

    const time = new Date().toLocaleTimeString()

    // log
    lastLogs.unshift(`[${time}] ${JSON.stringify(data)}`)
    if (lastLogs.length > 3) lastLogs.pop()

    updateLastLogTime()
    updateLogList()

    // status máquina (visual)
    const statusValue = data.status || data.machine_status || data.estado

    if (statusValue !== undefined) {
      if (statusValue === 'Running') {
        statusRunning.style.background = 'green'
        statusSleep.style.background = 'gray'
      } else {
        statusRunning.style.background = 'gray'
        statusSleep.style.background = 'red'
      }
    }

    // status robo exibido
    if (data.status_robo !== undefined) {
      taxaEl.textContent = data.status_robo

      // 🧠 CONTAGEM BASEADA EM TEXTO (NOVO)
      if (data.status_robo !== lastStatusRobo) {

        if (data.status_robo.includes("Rampa 1")) {
          countRampa1++
          vermelhoEl.textContent = countRampa1
        }

        if (data.status_robo.includes("Rampa 2")) {
          countRampa2++
          pretoEl.textContent = countRampa2
        }

        if (data.status_robo.includes("Rampa 3")) {
          countRampa3++
          prataEl.textContent = countRampa3
        }

        lastStatusRobo = data.status_robo
      }
    }

  } catch (err) {
    console.error(err)

    const time = new Date().toLocaleTimeString()
    lastLogs.unshift(`[${time}] Erro ao processar`)
    if (lastLogs.length > 3) lastLogs.pop()

    logTimeEl.textContent = 'Erro'
    updateLogList()
  }
}

// erro
source.onerror = () => {
  const time = new Date().toLocaleTimeString()

  lastLogs.unshift(`[${time}] Desconectado`)
  if (lastLogs.length > 3) lastLogs.pop()

  logTimeEl.textContent = 'Erro'
  updateLogList()

  statusEl.textContent = "SERVIDOR INATIVO"
}