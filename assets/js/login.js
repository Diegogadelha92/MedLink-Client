document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    
    if (!email || !senha) {
      mostrarErro('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8080/usuarios/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
      });
      
      if (response.ok) {
        const data = await response.text();
        localStorage.setItem('token', email);
        
        redirecionarPorTipo(data);
      } else {
        const erro = await response.text();
        mostrarErro(erro);
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
    }
  });
});

function redirecionarPorTipo(tipo) {
  switch(tipo?.toUpperCase()) {
    case 'ADMINISTRADOR':
      window.location.href = 'admin.html';
      break;
    case 'PROFISSIONAL':
      window.location.href = 'consultas.html';
      break;
    case 'PACIENTE':
      window.location.href = 'solicitacao.html';
      break;
    default:
      window.location.href = 'dashboard.html';
  }
}

function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro-msg');

  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.textContent = mensagem;
    
    setTimeout(() => {
      erroDiv.style.display = 'none';
    }, 5000);
  }
}