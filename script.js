const form = document.querySelector('#form-pokemon');
const feedback = document.querySelector('#feedback');
const listaCards = document.querySelector('#lista-cards');
const contador = document.querySelector('#contador');
const treinador = document.querySelector('#treinador');
const nome = document.querySelector('#nome');
const limpar = document.querySelector('#botaolimpar');
const batalha = document.querySelector('#botaobatalha');
const limparArena = document.querySelector('#botaolimpararena');
const tipo = document.querySelector('#tipo');
const cp = document.querySelector('#CP');

let debounceBusca;
let requisicaoAtual = 0;
let pokemonEncontrado = null;
let arena = [];

const URL_POKEAPI = 'https://pokeapi.co/api/v2/pokemon';
const CHAVE_STORAGE = 'arena-pokemon';

const COR_ERRO = '#f87171';
const COR_SUCESSO = '#4ade80';
const COR_INFO = '#a5b4fc';

/* ---------- API ---------- */

async function buscarDadosPokemon(nomePokemon) {
    const nomeFormatado = nomePokemon.toLowerCase().trim();

    try {
        const resposta = await fetch(`${URL_POKEAPI}/${nomeFormatado}`);

        if (!resposta.ok) {
            throw new Error('Pokémon não encontrado.');
        }

        return await resposta.json();
    } catch (error) {
        console.log('Erro ao buscar Pokémon:', error);
        return null;
    }
}

function extrairImagemPokemon(dadosPokemon) {
    return dadosPokemon?.sprites?.other?.['official-artwork']?.front_default
        || dadosPokemon?.sprites?.front_default
        || 'https://placehold.co/150x150?text=Pokemon';
}

function extrairTipoPokemon(dadosPokemon) {
    if (!dadosPokemon?.types) {
        return [];
    }

    return dadosPokemon.types.map(item => item.type.name);
}

// CP = soma de todos os stats base (HP, ataque, defesa, etc.)
function extrairCombatPower(dadosPokemon) {
    if (!dadosPokemon?.stats) {
        return 0;
    }

    return dadosPokemon.stats.reduce((total, item) => total + item.base_stat, 0);
}

/* ---------- Armazenamento ---------- */

function salvarArena() {
    try {
        localStorage.setItem(CHAVE_STORAGE, JSON.stringify(arena));
    } catch (error) {
        console.log('Não foi possível salvar a arena:', error);
    }
}

function carregarArena() {
    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE_STORAGE));
        return Array.isArray(salvo) ? salvo : [];
    } catch (error) {
        return [];
    }
}

function atualizarContador() {
    contador.textContent = `Arena (${arena.length})`;
}

function pokemonJaNaArena(id) {
    return arena.some(pokemon => pokemon.id === id);
}

/* ---------- Cards ---------- */

function aplicarEstiloPorTipo(card, tipos) {
    const cores = {
        fire: '#e25822',
        water: '#2980d9',
        grass: '#3a9d3a',
        electric: '#d4a800',
        poison: '#8e44ad',
        normal: '#7f8c8d',
        flying: '#8e9bd0',
        bug: '#7b9b32',
        ground: '#b58b52',
        rock: '#93805b',
        fighting: '#b83232',
        psychic: '#d85888',
        ice: '#64c9d9',
        ghost: '#705898',
        dragon: '#6350bd',
        dark: '#51483f',
        steel: '#8995a5',
        fairy: '#df91c0'
    };

    const cor = cores[tipos[0]] || '#4f46e5';

    card.style.borderColor = cor;
    card.style.background = `linear-gradient(145deg, ${cor}33, #111624 75%)`;
}

function criarCardPokemon(pokemon, animar) {
    const { id, nome: nomePokemon, imagem, tipos, cp: combatPower, treinador: nomeTreinador } = pokemon;

    const card = document.createElement('div');
    card.className = 'card-pokemon';
    card.dataset.id = id;

    if (animar) {
        card.classList.add('novo');
        card.addEventListener('animationend', () => card.classList.remove('novo'));
    }

    aplicarEstiloPorTipo(card, tipos);

    const img = document.createElement('img');
    img.className = 'card-pokemon-img';
    img.src = imagem;
    img.alt = nomePokemon;

    const nomeCard = document.createElement('h3');
    nomeCard.className = 'card-pokemon-nome';
    nomeCard.textContent =
        nomePokemon.charAt(0).toUpperCase() + nomePokemon.slice(1);

    const infoTipo = document.createElement('p');
    infoTipo.className = 'card-pokemon-info';
    infoTipo.textContent = `Tipo: ${tipos.join(', ') || 'Desconhecido'}`;

    const infoCP = document.createElement('p');
    infoCP.className = 'card-pokemon-info';
    infoCP.textContent = `CP: ${combatPower}`;

    const infoTreinador = document.createElement('p');
    infoTreinador.className = 'card-pokemon-info';
    infoTreinador.textContent = `Treinador: ${nomeTreinador || 'Sem treinador'}`;

    const btnRemover = document.createElement('button');
    btnRemover.type = 'button';
    btnRemover.className = 'btn-remover';
    btnRemover.textContent = 'x';
    btnRemover.title = 'Remover';
    btnRemover.setAttribute('aria-label', `Remover ${nomePokemon}`);
    btnRemover.addEventListener('click', function () {
        arena = arena.filter(item => item.id !== id);
        card.remove();
        salvarArena();
        atualizarContador();
    });

    card.append(btnRemover, img, nomeCard, infoTipo, infoCP, infoTreinador);
    return card;
}

function adicionarPokemon(pokemon) {
    arena.unshift(pokemon);
    listaCards.prepend(criarCardPokemon(pokemon, true));
    salvarArena();
    atualizarContador();
}

function renderizarArena() {
    listaCards.innerHTML = '';
    arena.forEach(pokemon => listaCards.append(criarCardPokemon(pokemon, false)));
    atualizarContador();
}

/* ---------- Ações ---------- */

function mostrarFeedback(mensagem, cor = COR_INFO) {
    feedback.textContent = mensagem;
    feedback.style.color = cor;
}

function limparCampos() {
    form.reset();
    pokemonEncontrado = null;
    requisicaoAtual++;
    clearTimeout(debounceBusca);
    mostrarFeedback('');
}

function esvaziarArena() {
    if (arena.length === 0) {
        mostrarFeedback('A arena já está vazia.', COR_INFO);
        return;
    }

    if (!confirm('Remover todos os Pokémons da arena?')) {
        return;
    }

    arena = [];
    renderizarArena();
    salvarArena();
    mostrarFeedback('Arena esvaziada.', COR_INFO);
}

function batalhar() {
    listaCards.querySelectorAll('.card-pokemon')
        .forEach(card => card.classList.remove('campeao'));

    if (arena.length < 2) {
        mostrarFeedback('Cadastre pelo menos 2 Pokémons para batalhar.', COR_ERRO);
        return;
    }

    const maiorCP = Math.max(...arena.map(pokemon => pokemon.cp));
    const campeoes = arena.filter(pokemon => pokemon.cp === maiorCP);

    campeoes.forEach(pokemon => {
        const card = listaCards.querySelector(`[data-id="${pokemon.id}"]`);
        if (card) {
            card.classList.add('campeao');
        }
    });

    if (campeoes.length > 1) {
        mostrarFeedback(`Empate! ${campeoes.length} Pokémons com CP ${maiorCP}.`, COR_INFO);
        return;
    }

    const { nome: nomeCampeao, treinador: treinadorCampeao } = campeoes[0];
    const nomeFormatado = nomeCampeao.charAt(0).toUpperCase() + nomeCampeao.slice(1);

    mostrarFeedback(
        `🏆 ${nomeFormatado} (${treinadorCampeao || 'Sem treinador'}) venceu com CP ${maiorCP}!`,
        COR_SUCESSO
    );
}

/* ---------- Eventos ---------- */

nome.addEventListener('input', function () {
    const valor = nome.value.trim();

    clearTimeout(debounceBusca);
    requisicaoAtual++;
    pokemonEncontrado = null;

    if (valor.length < 3) {
        tipo.value = '';
        cp.value = '';
        mostrarFeedback('Digite pelo menos 3 caracteres.', COR_ERRO);
        return;
    }

    mostrarFeedback('Buscando Pokémon...', COR_INFO);

    const idRequisicao = requisicaoAtual;

    debounceBusca = setTimeout(async function () {
        const dadosApi = await buscarDadosPokemon(valor);

        if (idRequisicao !== requisicaoAtual) {
            return;
        }

        if (!dadosApi) {
            tipo.value = '';
            cp.value = '';
            mostrarFeedback('Pokémon não encontrado.', COR_ERRO);
            return;
        }

        pokemonEncontrado = dadosApi;

        nome.value = dadosApi.name;
        tipo.value = extrairTipoPokemon(dadosApi).join(', ');
        cp.value = extrairCombatPower(dadosApi);

        mostrarFeedback('Pokémon encontrado!', COR_SUCESSO);
    }, 500);
});

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const nomeTreinador = treinador.value.trim();

    if (!nomeTreinador) {
        mostrarFeedback('Informe o nome do treinador.', COR_ERRO);
        return;
    }

    if (!pokemonEncontrado || nome.value.toLowerCase() !== pokemonEncontrado.name) {
        mostrarFeedback('Busque um Pokémon válido antes de cadastrar.', COR_ERRO);
        return;
    }

    if (pokemonJaNaArena(pokemonEncontrado.id)) {
        mostrarFeedback('Esse Pokémon já está na arena.', COR_ERRO);
        return;
    }

    adicionarPokemon({
        id: pokemonEncontrado.id,
        nome: pokemonEncontrado.name,
        imagem: extrairImagemPokemon(pokemonEncontrado),
        tipos: extrairTipoPokemon(pokemonEncontrado),
        cp: extrairCombatPower(pokemonEncontrado),
        treinador: nomeTreinador
    });

    mostrarFeedback('Pokémon cadastrado com sucesso!', COR_SUCESSO);
    pokemonEncontrado = null;
});

limpar.addEventListener('click', limparCampos);
batalha.addEventListener('click', batalhar);
limparArena.addEventListener('click', esvaziarArena);

/* ---------- Início ---------- */

arena = carregarArena();
renderizarArena();