const token = localStorage.getItem('token');
let contadorAreas = 0;

document.addEventListener('DOMContentLoaded', () => {
  carregarClinicas(); // Esta função agora também irá disparar o carregamento de profissionais
  adicionarArea();
  
  const form = document.querySelector('form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const clinica = document.getElementById('clinica-prof').value;
    const nome = document.getElementById('nome-prof').value;
    const email = document.getElementById('email-prof').value;
    const cpf = document.getElementById('cpf-prof').value;
    const nascimento = document.getElementById('nascimento-prof').value;
    const senha = document.getElementById('senha-prof').value;
    const tituloArea = document.getElementById('titulo-area').value;
    const descricaoArea = document.getElementById('descricao-area').value;
    
    if (!clinica || !nome || !email || !cpf || !nascimento || !senha || !tituloArea || !descricaoArea) {
      mostrarErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    const areasAdicionais = [];
    const areasInputs = document.querySelectorAll('.area-adicional');
    areasInputs.forEach(areaDiv => {
      const titulo = areaDiv.querySelector('.area-titulo').value;
      const descricao = areaDiv.querySelector('.area-descricao').value;
      if (titulo && descricao) {
        areasAdicionais.push({ titulo, descricao });
      }
    });
    
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
        tituloAreaAtuacao: tituloArea,
        descricaoAreaAtuacao: descricaoArea,
        areasAtuacao: areasAdicionais
      };
      
      const response = await fetch('http://localhost:8080/administradores/profissional', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosProfissional)
      });
      
      if (response.status === 201) {
        mostrarSucesso('Profissional adicionado com sucesso!');
        form.reset();
        document.getElementById('areas-container').innerHTML = '';
        contadorAreas = 0;
        
        // Recarrega a lista de profissionais após adicionar um novo
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
  });
});

async function carregarClinicas() {
  const selectClinica = document.getElementById('clinica-prof');
  
  try {
    const response = await fetch('http://localhost:8080/clinicas/' + token);
    
    if (response.ok) {
      const clinicas = await response.json();
      
      selectClinica.innerHTML = '<option value="">Selecione uma clínica</option>';
      
      clinicas.forEach(clinica => {
        const option = document.createElement('option');
        option.value = clinica;
        option.textContent = clinica;
        selectClinica.appendChild(option);
      });
      
      // *** NOVA IMPLEMENTAÇÃO ***
      // Após carregar as clínicas no dropdown, usa a PRIMEIRA clínica da lista
      // para carregar os profissionais na tabela.
      if (clinicas.length > 0) {
        await carregarProfissionais(clinicas[0]);
      } else {
        document.querySelector('.table tbody').innerHTML = 
          '<tr><td colspan="3">Nenhuma clínica associada a este administrador.</td></tr>';
      }
      
    } else {
      selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
      mostrarErro('Não foi possível carregar as clínicas.');
    }
  } catch (error) {
    console.error('Erro ao carregar clínicas:', error);
    selectClinica.innerHTML = '<option value="">Erro ao carregar clínicas</option>';
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

// *** NOVA FUNÇÃO ***
/**
 * Carrega e exibe os profissionais de uma clínica específica na tabela.
 * @param {string} nomeClinica - O nome da clínica para buscar os profissionais.
 */
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
      tbody.innerHTML = ''; // Limpa a tabela

      if (profissionais.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3">Nenhum profissional encontrado para esta clínica.</td></tr>';
        return;
      }

      // Popula a tabela com os dados
      profissionais.forEach(prof => {
        const tr = document.createElement('tr');
        
        const tdNome = document.createElement('td');
        tdNome.textContent = prof.nome;
        
        const tdEmail = document.createElement('td');
        tdEmail.textContent = prof.email;
        
        const tdAcoes = document.createElement('td');
        tdAcoes.className = 'row';
        
        const btnEditar = document.createElement('a');
        btnEditar.className = 'button secondary';
        btnEditar.href = '#'; // TODO: Adicionar link/função de edição
        btnEditar.textContent = 'Editar';
        // Ex: btnEditar.onclick = () => abrirModalEdicao(prof.email);
        
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


function adicionarArea() {
  const container = document.getElementById('areas-container');
  const areaDiv = document.createElement('div');
  areaDiv.className = 'area-adicional';
  areaDiv.style.cssText = 'display: grid; grid-template-columns: 1fr 2fr auto; gap: 1rem; margin-bottom: 0.5rem; align-items: end;';
  
  areaDiv.innerHTML = `
    <div class="field" style="margin: 0;">
      <label>Título</label>
      <input type="text" class="area-titulo" placeholder="Ex.: Ator de Novela" />
    </div>
    <div class="field" style="margin: 0;">
      <label>Descrição</label>
      <input type="text" class="area-descricao" placeholder="Ex.: Atua bem." />
    </div>
    <button type="button" class="button danger" onclick="removerArea(this)" style="height: fit-content;">Remover</button>
  `;  
  container.appendChild(areaDiv);
  contadorAreas++;
}

function removerArea(button) {
  const container = document.getElementById('areas-container');
  const totalAreas = container.querySelectorAll('.area-adicional').length;
  
  // Não permite remover se for a última área
  if (totalAreas <= 1) {
    mostrarErro('Deve haver pelo menos uma área de atuação.');
    return;
  }
  
  button.parentElement.remove();
  contadorAreas--;
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