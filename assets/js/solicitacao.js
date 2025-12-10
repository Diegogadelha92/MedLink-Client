const token = localStorage.getItem('token');
let profissionais = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    window.location.href = 'index.html';
    return;
  }

  carregarProfissionais();
  carregarHistoricoConsultas();
  
  const selectTipo = document.getElementById('tipo');
  if(selectTipo) {
      selectTipo.addEventListener('change', toggleCamposEndereco);
  }

  const form = document.querySelector('form');
  if(form) {
      form.addEventListener('submit', handleSubmitConsulta);
  }
});

async function carregarHistoricoConsultas() {
  const tbody = document.getElementById('lista-consultas');
  
  if (!tbody) return;

  try {
    const response = await fetch('http://localhost:8080/pacientes/consultas', {
      method: 'GET',
      headers: {
        'token': token
      }
    });

    if (response.ok) {
      const consultas = await response.json();
      tbody.innerHTML = ''; // Limpa a tabela

      if (consultas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Nenhuma consulta encontrada.</td></tr>';
        return;
      }

      consultas.forEach(c => {
        // Formata Data (YYYY-MM-DD -> DD/MM/YYYY)
        const dataFormatada = new Date(c.dataConsulta).toLocaleDateString('pt-BR', {timeZone: 'UTC'});
        // Formata Hora (HH:mm:ss -> HH:mm)
        const horaFormatada = c.horaInicio ? c.horaInicio.substring(0, 5) : '--:--';

        renderLinhaConsulta(c, dataFormatada, horaFormatada, tbody);
      });

    } else {
      console.error('Erro ao buscar histórico de consultas');
    }
  } catch (error) {
    console.error('Erro de conexão:', error);
  }
}

function renderLinhaConsulta(c, data, hora, tbody) {
  const tr = document.createElement('tr');
  
  // No contexto do paciente, o 'nomeDestinatario' deve ser o nome do Profissional/Clínica
  const profissionalInfo = c.nomeDestinatario;

  // Define uma classe de cor para o status
  let statusClass = '';
  if (c.statusConsulta === 'CONFIRMADA') statusClass = 'color: #28a745; font-weight: bold;'; // Verde
  else if (c.statusConsulta === 'CANCELADA' || c.statusConsulta === 'NEGADA') statusClass = 'color: #dc3545; font-weight: bold;'; // Vermelho
  else statusClass = 'color: #e0a800; font-weight: bold;'; // Amarelo/Laranja (Solicitada)

  tr.innerHTML = `
      <td>${profissionalInfo}</td>
      <td>${c.tipoConsulta}</td>
      <td>${data}</td>
      <td>${hora}</td>
      <td style="${statusClass}">${c.statusConsulta}</td>
  `;
  tbody.appendChild(tr);
}

async function carregarProfissionais() {
  const selectProfissional = document.getElementById('profissional');
  if(!selectProfissional) return;

  try {
    const response = await fetch('http://localhost:8080/profissionais', {
      method: 'GET',
      headers: { 'token': token }
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
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

function toggleCamposEndereco() {
  const tipo = document.getElementById('tipo').value;
  const camposEndereco = document.getElementById('campos-endereco');
  
  if (tipo === 'DOMICILIAR') {
    camposEndereco.style.display = 'block';
    setRequired('rua', true); setRequired('numero', true); 
    setRequired('bairro', true); setRequired('cidade', true); setRequired('estado', true);
  } else {
    camposEndereco.style.display = 'none';
    setRequired('rua', false); setRequired('numero', false); 
    setRequired('bairro', false); setRequired('cidade', false); setRequired('estado', false);
    
    // Limpar campos
    ['rua', 'numero', 'bairro', 'cidade', 'estado'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.value = '';
    });
  }
}

// Helper para evitar repetição de getElementById
function setRequired(id, isRequired) {
    const el = document.getElementById(id);
    if(el) el.required = isRequired;
}

async function handleSubmitConsulta(e) {
  e.preventDefault();

  const tipo = document.getElementById('tipo').value;
  const emailProfissional = document.getElementById('profissional').value;
  const data = document.getElementById('data').value;
  const horaInicio = document.getElementById('hora').value;

  if (!tipo || !emailProfissional || !data || !horaInicio) {
    mostrarErro('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  // Validação de data simples
  const dataConsulta = new Date(data);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (dataConsulta < hoje) {
    mostrarErro('A data da consulta não pode ser no passado.');
    return;
  }

  const selectProfissional = document.getElementById('profissional');
  const optionSelecionada = selectProfissional.options[selectProfissional.selectedIndex];
  const clinica = optionSelecionada.dataset.clinica;

  let endereco = { rua: '', numero: '', bairro: '', cidade: '', estado: '' };

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
      endereco: endereco,
      dataConsulta: data,
      horaInicio: horaInicio,
      tipoConsulta: tipo,
      justificativa: '',
      statusConsulta: 'SOLICITADA'
    };

    const response = await fetch('http://localhost:8080/pacientes/consultas/solicitar', {
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
      // ATUALIZA A LISTA IMEDIATAMENTE APÓS O SUCESSO
      carregarHistoricoConsultas(); 
    } else {
      const erro = await response.text();
      mostrarErro(erro || 'Erro ao solicitar consulta.');
    }
  } catch (error) {
    console.error('Erro ao solicitar consulta:', error);
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

function limparFormulario() {
  document.querySelector('form').reset();
  document.getElementById('campos-endereco').style.display = 'none';
  // Garante que os campos voltem a não ser obrigatórios visualmente
  const tipoSelect = document.getElementById('tipo');
  if(tipoSelect) tipoSelect.dispatchEvent(new Event('change'));
}

function mostrarErro(mensagem) {
  const erroDiv = document.getElementById('erro-msg');
  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.className = 'msg-box error'; // Sugestão: usar classes CSS
    erroDiv.style.backgroundColor = '#fee';
    erroDiv.style.border = '1px solid #fcc';
    erroDiv.style.color = '#c33';
    erroDiv.style.padding = '12px';
    erroDiv.textContent = mensagem;
    setTimeout(() => { erroDiv.style.display = 'none'; }, 5000);
  }
}

function mostrarSucesso(mensagem) {
  const erroDiv = document.getElementById('erro-msg'); // Reutilizando a div de msg
  if (erroDiv) {
    erroDiv.style.display = 'block';
    erroDiv.className = 'msg-box success';
    erroDiv.style.backgroundColor = '#efe';
    erroDiv.style.border = '1px solid #cfc';
    erroDiv.style.color = '#3c3';
    erroDiv.style.padding = '12px';
    erroDiv.textContent = mensagem;
    setTimeout(() => { erroDiv.style.display = 'none'; }, 5000);
  }
}