const token = localStorage.getItem('token');
let contadorAreas = 0;
let contadorAreasEdicao = 0;
let profissionalEmEdicao = null;

document.addEventListener('DOMContentLoaded', () => {
  carregarClinicas();
  adicionarArea();

  const form = document.querySelector('form');
  form.addEventListener('submit', handleSubmitCadastro);

  const formEditar = document.getElementById('form-editar');
  formEditar.addEventListener('submit', handleSubmitEdicao);

  window.onclick = function(event) {
    const modal = document.getElementById('modal-editar');
    if (event.target === modal) {
      fecharModal();
    }
  };
});

async function handleSubmitCadastro(e) {
  e.preventDefault();

  const clinica = document.getElementById('clinica-prof').value;
  const nome = document.getElementById('nome-prof').value;
  const email = document.getElementById('email-prof').value;
  const cpf = document.getElementById('cpf-prof').value;
  const nascimento = document.getElementById('nascimento-prof').value;
  const senha = document.getElementById('senha-prof').value;

  if (!clinica || !nome || !email || !cpf || !nascimento || !senha) {
    mostrarErro('Por favor, preencha todos os campos obrigatórios.');
    return;
  }

  const areasAdicionais = coletarAreas('areas-container');

  if (areasAdicionais.length === 0) {
    mostrarErro('Adicione pelo menos uma área de atuação.');
    return;
  }

  try {
    const dadosProfissional = {
      clinica: clinica,
      nome: nome,
      email: email,
      senha: senha,
      cpf: cpf,
      dataNascimento: nascimento,
      areasAtuacao: areasAdicionais,
      turnosAtendimento: ['MATUTINO', 'VESPERTINO']
    };

    const response = await fetch('http://localhost:8080/administradores/profissional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(dadosProfissional)
    });

    if (response.status === 201) {
      mostrarSucesso('Profissional adicionado com sucesso!');
      e.target.reset();
      document.getElementById('areas-container').innerHTML = '';
      contadorAreas = 0;
      adicionarArea();
      carregarClinicas();

      const clinicaSelecionada = document.getElementById('clinica-prof').value;
      if (clinicaSelecionada) {
        await carregarProfissionais(clinicaSelecionada);
      }
    } else {
      const erro = await response.text();
      mostrarErro(erro || 'Erro ao adicionar profissional.');
    }
  } catch (error) {
    console.error('Erro ao adicionar profissional:', error);
    mostrarErro('Erro ao conectar com o servidor. Tente novamente.');
  }
}

async function handleSubmitEdicao(e) {
  e.preventDefault();

  const id = document.getElementById('edit-id').value;
  const clinica = document.getElementById('edit-clinica').value;
  const nome = document.getElementById('edit-nome').value;
  const email = document.getElementById('edit-email').value;
  const cpf = document.getElementById('edit-cpf').value;
  const nascimento = document.getElementById('edit-nascimento').value;
  const senha = document.getElementById('edit-senha').value;
  const inativo = document.getElementById('edit-status').value === 'inativo' ? true : false;

  if (!clinica || !nome || !email || !cpf || !nascimento) {
    mostrarErro('Por favor, preencha todos os campos obrigatórios.', 'edit-erro-msg');
    return;
  }

  const turnosAtendimento = [];
  if (document.getElementById('turno-matutino').checked) {
    turnosAtendimento.push('MATUTINO');
  }
  if (document.getElementById('turno-vespertino').checked) {
    turnosAtendimento.push('VESPERTINO');
  }

  if (turnosAtendimento.length === 0) {
    mostrarErro('Selecione pelo menos um turno de atendimento.', 'edit-erro-msg');
    return;
  }

  const areasAdicionais = coletarAreas('edit-areas-container');

  if (areasAdicionais.length === 0) {
    mostrarErro('Adicione pelo menos uma área de atuação.', 'edit-erro-msg');
    return;
  }

  try {
    const dadosProfissional = {
      id: id,
      clinica: clinica,
      nome: nome,
      email: email,
      cpf: cpf,
      dataNascimento: nascimento,
      areasAtuacao: areasAdicionais,
      turnosAtendimento: turnosAtendimento,
      inativo: inativo
    };

    if (senha) {
      dadosProfissional.senha = senha;
    }

    const response = await fetch('http://localhost:8080/administradores/profissional', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      },
      body: JSON.stringify(dadosProfissional)
    });

    if (response.ok) {
      mostrarSucesso('Profissional atualizado com sucesso!');
      fecharModal();
      carregarClinicas();

      const clinicaSelecionada = document.getElementById('clinica-prof').value;
      if (clinicaSelecionada) {
        await carregarProfissionais(clinicaSelecionada);
      }
    } else {
      const erro = await response.text();
      mostrarErro(erro || 'Erro ao atualizar profissional.', 'edit-erro-msg');
    }
  } catch (error) {
    console.error('Erro ao atualizar profissional:', error);
    mostrarErro('Erro ao conectar com o servidor. Tente novamente.', 'edit-erro-msg');
  }
}

async function carregarClinicas() {
  const selectClinica = document.getElementById('clinica-prof');
  const selectEditClinica = document.getElementById('edit-clinica');

  try {
    const response = await fetch('http://localhost:8080/clinicas/' + token);

    if (response.ok) {
      const clinicas = await response.json();

      selectClinica.innerHTML = '<option value="">Selecione uma clínica</option>';
      selectEditClinica.innerHTML = '<option value="">Selecione uma clínica</option>';

      clinicas.forEach(clinica => {
        const option1 = document.createElement('option');
        option1.value = clinica;
        option1.textContent = clinica;
        selectClinica.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = clinica;
        option2.textContent = clinica;
        option2.selected = true;
        selectEditClinica.appendChild(option2);
      });

      if (clinicas.length > 0) {
        await carregarProfissionais(clinicas[0]);
      } else {
        document.querySelector('.table tbody').innerHTML =
          '<tr><td colspan="3">Nenhuma clínica associada a este administrador.</td></tr>';
      }

    } else {
      selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
      selectEditClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
      mostrarErro('Não foi possível carregar as clínicas.');
    }
  } catch (error) {
    console.error('Erro ao carregar clínicas:', error);
    selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
    selectEditClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

async function carregarProfissionais(nomeClinica) {
  const tbody = document.querySelector('.table tbody');
  tbody.innerHTML = '<tr><td colspan="3">Carregando profissionais...</td></tr>';

  try {
    const response = await fetch('http://localhost:8080/profissionais/clinica/' + nomeClinica, {
      method: 'GET',
      headers: {
        'token': token
      }
    });

    if (response.ok) {
      const profissionais = await response.json();
      tbody.innerHTML = '';

      if (profissionais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Nenhum profissional encontrado para esta clínica.</td></tr>';
        return;
      }

      profissionais.forEach(prof => {
        const tr = document.createElement('tr');

        const tdNome = document.createElement('td');
        tdNome.textContent = prof.nome;

        const tdEmail = document.createElement('td');
        tdEmail.textContent = prof.email;

        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'row';

        const btnEditar = document.createElement('button');
        btnEditar.className = 'button secondary';
        btnEditar.textContent = 'Editar';
        btnEditar.onclick = () => abrirModalEditar(prof);

        tdAcoes.appendChild(btnEditar);

        tr.appendChild(tdNome);
        tr.appendChild(tdEmail);
        tr.appendChild(tdAcoes);

        tbody.appendChild(tr);
      });

    } else {
      const erro = await response.text();
      tbody.innerHTML = '<tr><td colspan="3">Erro ao carregar profissionais.</td></tr>';
      mostrarErro(erro || 'Erro ao carregar lista de profissionais.');
    }
  } catch (error) {
    console.error('Erro ao carregar profissionais:', error);
    tbody.innerHTML = '<tr><td colspan="3">Erro de conexão. Não foi possível listar os profissionais.</td></tr>';
    mostrarErro('Erro de conexão ao carregar profissionais.');
  }
}

async function abrirModalEditar(profissional) {
  profissionalEmEdicao = profissional;

  try {
    const response = await fetch('http://localhost:8080/usuarios/' + profissional.email, {
      method: 'GET',
      headers: {
        'token': token
      }
    });

    if (response.ok) {
      const profCompleto = await response.json();
      preencherFormularioEdicao(profCompleto);
      document.getElementById('modal-editar').style.display = 'block';
    } else {
      mostrarErro('Erro ao carregar dados do profissional.');
    }
  } catch (error) {
    console.error('Erro ao carregar profissional:', error);
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

function preencherFormularioEdicao(prof) {
  document.getElementById('edit-id').value = prof.id || '';
  document.getElementById('edit-nome').value = prof.nome || '';
  document.getElementById('edit-email').value = prof.email || '';
  document.getElementById('edit-cpf').value = prof.cpf || '';
  document.getElementById('edit-nascimento').value = prof.dataNascimento || '';
  document.getElementById('edit-senha').value = prof.senha || '';
  document.getElementById('edit-status').value = prof.inativo ? 'inativo' : 'ativo';

  document.getElementById('turno-matutino').checked = false;
  document.getElementById('turno-vespertino').checked = false;

  if (prof.turnosAtendimento && Array.isArray(prof.turnosAtendimento)) {
    if (prof.turnosAtendimento.includes('MATUTINO')) {
      document.getElementById('turno-matutino').checked = true;
    }
    if (prof.turnosAtendimento.includes('VESPERTINO')) {
      document.getElementById('turno-vespertino').checked = true;
    }
  }

  const container = document.getElementById('edit-areas-container');
  container.innerHTML = '';
  contadorAreasEdicao = 0;

  if (prof.areasAtuacao && prof.areasAtuacao.length > 0) {
    prof.areasAtuacao.forEach(area => {
      adicionarAreaEdicao(area.titulo, area.descricao);
    });
  } else {
    adicionarAreaEdicao();
  }
}

function fecharModal() {
  document.getElementById('modal-editar').style.display = 'none';
  document.getElementById('form-editar').reset();
  document.getElementById('edit-areas-container').innerHTML = '';
  contadorAreasEdicao = 0;
  profissionalEmEdicao = null;
}

function adicionarArea() {
  const container = document.getElementById('areas-container');
  const areaDiv = document.createElement('div');
  areaDiv.className = 'area-adicional';
  areaDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr auto; gap: 1rem; margin-bottom: 0.5rem; align-items: end;';

  areaDiv.innerHTML = `
    <div class="field" style="margin: 0;">
      <label>Título</label>
      <input type="text" class="area-titulo" placeholder="Ex.: Nutricionista" />
    </div>
    <div class="field" style="margin: 0;">
      <label>Descrição</label>
      <input type="text" class="area-descricao" placeholder="Ex.: Especialista em nutrição" />
    </div>
    <button type="button" class="button danger" onclick="removerArea(this)" style="height: fit-content;">Remover</button>
  `;
  container.appendChild(areaDiv);
  contadorAreas++;
}

function adicionarAreaEdicao(titulo = '', descricao = '') {
  const container = document.getElementById('edit-areas-container');
  const areaDiv = document.createElement('div');
  areaDiv.className = 'area-adicional';
  areaDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr auto; gap: 1rem; margin-bottom: 0.5rem; align-items: end;';

  areaDiv.innerHTML = `
    <div class="field" style="margin: 0;">
      <label>Título</label>
      <input type="text" class="area-titulo" placeholder="Ex.: Nutricionista" value="${titulo}" />
    </div>
    <div class="field" style="margin: 0;">
      <label>Descrição</label>
      <input type="text" class="area-descricao" placeholder="Ex.: Especialista em nutrição" value="${descricao}" />
    </div>
    <button type="button" class="button danger" onclick="removerAreaEdicao(this)" style="height: fit-content;">Remover</button>
  `;
  container.appendChild(areaDiv);
  contadorAreasEdicao++;
}

function removerArea(button) {
  const container = document.getElementById('areas-container');
  const totalAreas = container.querySelectorAll('.area-adicional').length;

  if (totalAreas <= 1) {
    mostrarErro('Deve haver pelo menos uma área de atuação.');
    return;
  }

  button.parentElement.remove();
  contadorAreas--;
}

function removerAreaEdicao(button) {
  const container = document.getElementById('edit-areas-container');
  const totalAreas = container.querySelectorAll('.area-adicional').length;

  if (totalAreas <= 1) {
    mostrarErro('Deve haver pelo menos uma área de atuação.', 'edit-erro-msg');
    return;
  }

  button.parentElement.remove();
  contadorAreasEdicao--;
}

function coletarAreas(containerId) {
  const areas = [];
  const areasInputs = document.querySelectorAll(`#${containerId} .area-adicional`);
  areasInputs.forEach(areaDiv => {
    const titulo = areaDiv.querySelector('.area-titulo').value;
    const descricao = areaDiv.querySelector('.area-descricao').value;
    if (titulo && descricao) {
      areas.push({ titulo, descricao });
    }
  });
  return areas;
}

function mostrarErro(mensagem, elementoId = 'erro-msg') {
  const erroDiv = document.getElementById(elementoId);
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

function mostrarSucesso(mensagem, elementoId = 'erro-msg') {
  const erroDiv = document.getElementById(elementoId);
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