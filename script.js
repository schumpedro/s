const form = document.querySelector('#form-pokemon');
const feedback = document.querySelector('#feedback');
const listaCards = document.querySelector('#lista-cards');
const treinador = document.querySelector('#treinador');
const nome = document.querySelector('#nome');
const limpar = document.querySelector('#botaolimpar');
const tipo = document.querySelector('#tipo');
const cp = document.querySelector('#CP');

let debounceBusca;
let requisicaoAtual = 0;
let pokemonEncontrado = null;

const URL_POKEAPI = 'https://pokeapi.co/api/v2/pokemon';

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

function extrairCombatPower(dadosPokemon) {
    return dadosPokemon?.base_experience ?? 0;
}

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

function criarCardPokemon(nomePokemon, imagem, tipos, combatPower, nomeTreinador) {
    const card = document.createElement('div');
    card.className = 'card-pokemon';

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
        card.remove();
    });

    card.append(btnRemover, img, nomeCard, infoTipo, infoCP, infoTreinador);
    listaCards.prepend(card);
}

function mostrarFeedback(mensagem, cor = '#e0e7ff') {
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

nome.addEventListener('input', function () {
    const valor = nome.value.trim();

    clearTimeout(debounceBusca);
    requisicaoAtual++;
    pokemonEncontrado = null;

    if (valor.length < 3) {
        tipo.value = '';
        cp.value = '';
        mostrarFeedback('Digite pelo menos 3 caracteres.', '#f87171');
        return;
    }

    mostrarFeedback('Buscando Pokémon...', '#a5b4fc');

    const idRequisicao = requisicaoAtual;

    debounceBusca = setTimeout(async function () {
        const dadosApi = await buscarDadosPokemon(valor);

        if (idRequisicao !== requisicaoAtual) {
            return;
        }

        if (!dadosApi) {
            tipo.value = '';
            cp.value = '';
            mostrarFeedback('Pokémon não encontrado.', '#f87171');
            return;
        }

        pokemonEncontrado = dadosApi;

        const tiposPokemon = extrairTipoPokemon(dadosApi);
        const combatPower = extrairCombatPower(dadosApi);

        nome.value = dadosApi.name;
        tipo.value = tiposPokemon.join(', ');
        cp.value = combatPower;

        mostrarFeedback('Pokémon encontrado!', '#4ade80');
    }, 500);
});

form.addEventListener('submit', function (event) {
    event.preventDefault();

    const nomeTreinador = treinador.value.trim();

    if (!nomeTreinador) {
        mostrarFeedback('Informe o nome do treinador.', '#f87171');
        return;
    }

    if (!pokemonEncontrado || nome.value.toLowerCase() !== pokemonEncontrado.name) {
        mostrarFeedback('Busque um Pokémon válido antes de cadastrar.', '#f87171');
        return;
    }

    criarCardPokemon(
        pokemonEncontrado.name,
        extrairImagemPokemon(pokemonEncontrado),
        extrairTipoPokemon(pokemonEncontrado),
        extrairCombatPower(pokemonEncontrado),
        nomeTreinador
    );

    mostrarFeedback('Pokémon cadastrado com sucesso!', '#4ade80');
    pokemonEncontrado = null;
});

limpar.addEventListener('click', limparCampos);