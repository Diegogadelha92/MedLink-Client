const token = localStorage.getItem('token');
let profissionais = [];

document.addEventListener('DOMContentLoaded', () => {
  carregarProfissionais();
  
  const selectTipo = document.getElementById('tipo');
  selectTipo.addEventListener('change', toggleCamposEndereco);

  const form = document.querySelector('form');
  form.addEventListener('submit', handleSubmitConsulta);
});

async function carregarProfissionais() {
  const selectProfissional = document.getElementById('profissional');

  try {
    const response = await fetch('http://localhost:8080/profissionais', {
      method: 'GET',
      headers: {
        'token': token
      }
    });

    if (response.ok) {
      profissionais = await response.json();
      selectProfissional.innerHTML = '<option value="" disabled selected>Selecione um profissional</option>';

      profissionais.forEach(prof => {
        const option = document.createElement('option');
        option.value = prof.email;
        option.textContent = `${prof.nome} - ${prof.clinica}`;
        option.dataset.clinica = prof.clinica;
        selectProfissional.appendChild(option);
      });

    } else {
      selectProfissional.innerHTML = '<option value="">Erro ao carregar profissionais</option>';
      mostrarErro('Não foi possível carregar a lista de profissionais.');
    }
  } catch (error) {
    console.error('Erro ao carregar profissionais:', error);
    selectProfissional.innerHTML = '<option value="">Erro ao carregar profissionais</option>';
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

function toggleCamposEndereco() {
  const tipo = document.getElementById('tipo').value;
  const camposEndereco = document.getElementById('campos-endereco');
  
  if (tipo === 'DOMICILIAR') {
    camposEndereco.style.display = 'block';
    document.getElementById('rua').required = true;
    document.getElementById('numero').required = true;
    document.getElementById('bairro').required = true;
    document.getElementById('cidade').required = true;
    document.getElementById('estado').required = true;
  } else {
    camposEndereco.style.display = 'none';
    document.getElementById('rua').required = false;
    document.getElementById('numero').required = false;
    document.getElementById('bairro').required = false;
    document.getElementById('cidade').required = false;
    document.getElementById('estado').required = false;
    document.getElementById('rua').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';
  }
}

async function handleSubmitConsulta(e) {
  e.preventDefault();

  const tipo = document.getElementById('tipo').value;
  const emailProfissional = document.getElementById('profissional').value;
  const data = document.getElementById('data').value;
  const horaInicio = document.getElementById('hora').value;
  const justificativa = document.getElementById('justificativa').value;

  if (!tipo || !emailProfissional || !data || !horaInicio) {
    mostrarErro('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dataRegex.test(data)) {
    mostrarErro('Data inválida. Use o formato AAAA-MM-DD.');
    return;
  }

  const dataConsulta = new Date(data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (dataConsulta < hoje) {
    mostrarErro('A data da consulta não pode ser no passado.');
    return;
  }

  const [horaInicioHoras, horaInicioMinutos] = horaInicio.split(':').map(Number);
  const horaFimHoras = horaInicioHoras + 1;
  const horaFim = `${String(horaFimHoras).padStart(2, '0')}:${String(horaInicioMinutos).padStart(2, '0')}`;

  const selectProfissional = document.getElementById('profissional');
  const optionSelecionada = selectProfissional.options[selectProfissional.selectedIndex];
  const clinica = optionSelecionada.dataset.clinica;

  // SEMPRE enviar um objeto endereco (evita NPE no backend)
  let endereco = {
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: ''
  };

  if (tipo === 'DOMICILIAR') {
    const rua = document.getElementById('rua').value.trim();
    const numero = document.getElementById('numero').value.trim();
    const bairro = document.getElementById('bairro').value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value.trim();

    if (!rua || !numero || !bairro || !cidade || !estado) {
      mostrarErro('Por favor, preencha todos os campos de endereço.');
      return;
    }

    endereco = { rua, numero, bairro, cidade, estado };
  }

  try {
    const dadosConsulta = {
      emailDestinatario: emailProfissional,
      clinica: clinica,
      endereco: endereco,               // nunca null
      dataConsulta: data,               // "YYYY-MM-DD"
      horaInicio: horaInicio,           // "HH:mm" (ajuste para "HH:mm:ss" se necessário)
      horaFim: horaFim,                 // "HH:mm"
      tipoConsulta: tipo,
      justificativa: justificativa || null,
      statusConsulta: 'SOLICITADA'
    };

    const response = await fetch('http://localhost:8080/consultas/solicitar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(dadosConsulta)
    });

    if (response.status === 201 || response.ok) {
      mostrarSucesso('Consulta solicitada com sucesso!');
      limparFormulario();
    } else {
      const erro = await response.text();
      mostrarErro(erro || 'Erro ao solicitar consulta.');
    }
  } catch (error) {
    console.error('Erro ao solicitar consulta:', error);
    mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
  }
}

function limparFormulario() {
  document.querySelector('form').reset();
  document.getElementById('campos-endereco').style.display = 'none';
  document.getElementById('rua').required = false;
  document.getElementById('numero').required = false;
  document.getElementById('bairro').required = false;
  document.getElementById('cidade').required = false;
  document.getElementById('estado').required = false;
}

function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro-msg');
  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.style.backgroundColor = '#fee';
    erroDiv.style.border = '1px solid #fcc';
    erroDiv.style.color = '#c33';
    erroDiv.style.padding = '12px';
    erroDiv.style.borderRadius = '4px';
    erroDiv.style.marginTop = '16px';
    erroDiv.textContent = mensagem;

    setTimeout(() => {
      erroDiv.style.display = 'none';
    }, 5000);
  }
}

function mostrarSucesso(mensagem) {
  const erroDiv = document.getElementById('erro-msg');
  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.style.backgroundColor = '#efe';
    erroDiv.style.border = '1px solid #cfc';
    erroDiv.style.color = '#3c3';
    erroDiv.style.padding = '12px';
    erroDiv.style.borderRadius = '4px';
    erroDiv.style.marginTop = '16px';
    erroDiv.textContent = mensagem;

    setTimeout(() => {
      erroDiv.style.display = 'none';
    }, 5000);
  }
}
