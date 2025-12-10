const token = localStorage.getItem('token');

document.addEventListener('DOMContentLoaded', () => {
  carregarClinicas();
  
  const form = document.querySelector('form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clinica = document.getElementById('clinica').value;
    const nome = document.getElementById('nome').value;
    const nascimento = document.getElementById('nascimento').value;
    const email = document.getElementById('email').value;
    const cpf = document.getElementById('cpf').value;
    const senha = document.getElementById('senha').value;
    
    if (!clinica || !nome || !nascimento || !email || !cpf || !senha) {
      mostrarErro('Por favor, preencha todos os campos.');
      return;
    }
    
    try {
      const dadosCadastro = {
        clinica: clinica,
        nome: nome,
        email: email,
        senha: senha,
        cpf: cpf,
        dataNascimento: nascimento
      };
      
      const responseCadastro = await fetch('http://localhost:8080/pacientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify(dadosCadastro)
      });
      
      if (responseCadastro.status === 201) {
        await fazerLogin(email, senha);
      } else {
        const erro = await responseCadastro.text();
        mostrarErro(erro);
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
    }
  });
});

async function carregarClinicas() {
  const selectClinica = document.getElementById('clinica');
  
  try {
    const response = await fetch('http://localhost:8080/clinicas');
    
    if (response.ok) {
      const clinicas = await response.json();
      
      selectClinica.innerHTML = '<option value="">Selecione uma clínica</option>';
      
      clinicas.forEach(clinica => {
        const option = document.createElement('option');
        option.value = clinica;
        option.textContent = clinica;
        selectClinica.appendChild(option);
      });
    } else {
      selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
      mostrarErro('Não foi possível carregar as clínicas. Recarregue a página.');
    }
  } catch (error) {
    console.error('Erro ao carregar clínicas:', error);
    selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

async function fazerLogin(email, senha) {
  try {
    const response = await fetch('http://localhost:8080/usuarios/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });
    
    const tipoUsuario = await response.text();
    
    if (response.ok) {
      localStorage.setItem('token', email);
      localStorage.setItem('tipoUsuario', tipoUsuario);
      
      redirecionarPorTipo(tipoUsuario);
    } else {
      mostrarErro('Conta criada, mas erro ao fazer login. Tente fazer login manualmente.');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 3000);
    }
  } catch (error) {
    console.error('Erro ao fazer login automático:', error);
    mostrarErro('Conta criada! Redirecionando para o login...');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 2000);
  }
}

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
      window.location.href = 'index.html';
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