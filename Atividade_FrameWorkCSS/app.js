const express = require('express')
const exphbs = require('express-handlebars')
const app = express()
const sequelize = require('./config/bd')
const methodOverride = require('method-override')

const Filme = require('./models/filme.model');
const FichaTecnica = require('./models/fichaTecnica.model');
const Diretor = require('./models/diretor.model');
const Artista = require('./models/artista.model.js');
require('./models/relacionamentosModels');

app.engine(
    'handlebars',
    exphbs.engine({
        defaultLayout: false,
        helpers: {
            eq: (a, b) => a === b
        }
    })
)

app.set(
    'view engine',
    'handlebars'
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body._method !== 'undefined') {
        return req.body._method
    }

    return undefined
}))
app.use((req, res, next) => {
    console.log('Método:', req.method);
    console.log('URL:', req.url);
    next();
});

app.get(
    '/', 
    (req, res) => { 
        res.render('home')
    }
)

app.get(
    '/filmes', 
    async (req, res) => {
        const filmes = await Filme.findAll({raw: true});
        res.render('filmes', { filmes });
    }
);

app.get(
    '/filme/cadastrar', 
    async (req, res) => {
        const diretores = await Diretor.findAll({ raw: true });
        const artistas = await Artista.findAll({ raw: true });
        res.render('cadastrarFilme', { diretores, artistas });
    }
);

app.post(
    '/filme/cadastrar', 
    async (req, res) => {
        const nome = req.body.nome;
        const ano = req.body.ano;
        const diretorId = req.body.diretorId;
        const artistas = Array.isArray(req.body.artistas)
            ? req.body.artistas
            : [req.body.artistas];

        const filme = await Filme.create({
            nome: nome,
            ano: ano,
            diretorId: diretorId
    });

        await filme.setArtistas(artistas);
        res.redirect('/filmes');
    }
);

app.get(
    '/filme/:id/editar', 
    async (req, res) => {
        const id = req.params.id;
        const filme = await Filme.findByPk(id, {raw: true});
        res.render('editarFilme', { filme });
    }
);

app.get(
    '/filmes/:id',
    async (req, res) => {
        const id = req.params.id;
        const filme = await Filme.findByPk(id, {
            include: [
                { model: FichaTecnica, as: 'fichaTecnica' },
                { model: Diretor, as: 'diretor' },
                { model: Artista, as: 'artistas' }
            ]
        });

        if (!filme) {
            return res.status(404).send('Filme não encontrado');
        }

        res.render('detalharFilme', {
            filme: filme.toJSON()
        });
    }
);

app.put(
    '/filme/:id/editar', 
    async (req, res) => {
        const id = req.params.id;
        const nome = req.body.nome;
        const ano = req.body.ano;
    
        const filme = await Filme.findByPk(id);
    
        filme.nome = nome;
        filme.ano = ano;
        await filme.save();

        res.redirect('/filmes');
    }
);

app.delete(
    '/filme/:id/delete',
    async (req, res) => {
        const id = req.params.id;
        const filme = await Filme.findByPk(id);

        if (!filme) {
            return res.status(404).send('Filme não encontrado');
        }

        await filme.destroy();

        res.redirect('/filmes');
    }
);

app.get(
    '/filme/:id/ficha-tecnica/cadastrar', 
    async (req, res) => {
        const id = req.params.id;
        const filme = await Filme.findByPk(id, { raw: true });

        res.render('cadastrarFichaTecnica', { filme });
    }
);

app.post(
    '/filme/:id/ficha-tecnica/cadastrar', 
    async (req, res) => {
        const id = req.params.id;
        const duracaoMinutos = req.body.duracaoMinutos;
        const orcamento = req.body.orcamento;
        const bilheteria = req.body.bilheteria;

        const filme = await Filme.findByPk(id);

        await filme.createFichaTecnica({
            duracaoMinutos: duracaoMinutos,
            orcamento: orcamento,
            bilheteria: bilheteria
        });

        res.redirect(`/filmes/${id}`);
    }
);

app.get(
    '/diretores', 
    async (req, res) => {
        const diretores = await Diretor.findAll({ raw: true });
        res.render('diretores', { diretores });
    }
);

app.get(
    '/diretor/cadastrar', 
    async (req, res) => {
        res.render('cadastrarDiretor');
    }
);

app.post(
    '/diretor/cadastrar', 
    async (req, res) => {
        const nome = req.body.nome;
        const anoNascimento = req.body.anoNascimento;
        const nacionalidade = req.body.nacionalidade;

        await Diretor.create({
            nome: nome,
            anoNascimento: anoNascimento,
            nacionalidade: nacionalidade
        });

        res.redirect('/diretores');
    }
);

app.get(
    '/diretores/:id',
    async (req, res) => {
        const id = req.params.id;
        const diretor = await Diretor.findByPk(id, {
            include: [
                {
                    model: Filme,
                    as: 'filmes'
                }
            ]
        });

        if (!diretor) {
            return res.status(404).send('Diretor não encontrado');
        }

        res.render('detalharDiretor', {
            diretor: diretor.toJSON()
        });
    }
);

app.get('/diretor/:id/editar', async (req, res) => {
    const id = req.params.id;

    const diretor = await Diretor.findByPk(id, {
        raw: true
    });

    if (!diretor) {
        return res.status(404).send('Diretor não encontrado');
    }

    res.render('editarDiretor', { diretor });
});

app.put(
    '/diretor/:id/editar', 
    async (req, res) => {
        const id = req.params.id;
        const diretor = await Diretor.findByPk(id);

        if (!diretor) {
            return res.status(404).send('Diretor não encontrado');
        }

        diretor.nome = req.body.nome;
        diretor.anoNascimento = req.body.anoNascimento;
        diretor.nacionalidade = req.body.nacionalidade;

        await diretor.save();

        res.redirect('/diretores');
    }
);

app.delete(
    '/diretor/:id/delete', 
    async (req, res) => {
        const id = req.params.id;
        const diretor = await Diretor.findByPk(id);

        if (!diretor) {
            return res.status(404).send('Diretor não encontrado');
        }

        await diretor.destroy();

        res.redirect('/diretores');
    }
);

app.get(
    '/artistas', 
    async (req, res) => {
        const artistas = await Artista.findAll({ raw: true });
        res.render('artistas', { artistas });
    }
);

app.get(
    '/artista/cadastrar', 
    async (req, res) => {
        res.render('cadastrarArtista');
    }
);

app.post(
    '/artista/cadastrar', 
    async (req, res) => {
        const nome = req.body.nome;
        const anoNascimento = req.body.anoNascimento;
        const nomeArtistico = req.body.nomeArtistico;

        await Artista.create({
            nome: nome,
            anoNascimento: anoNascimento,
            nomeArtistico: nomeArtistico
        });

        res.redirect('/artistas');
    }
);

app.get(
    '/artistas/:id',
    async (req, res) => {
        const id = req.params.id;
        const artista = await Artista.findByPk(id, {
            include: [
                {
                    model: Filme,
                    as: 'filmes'
                }
            ]
        });

        if (!artista) {
            return res.status(404).send('Artista não encontrado');
        }

        res.render('detalharArtista', {
            artista: artista.toJSON()
        });
    }
);

app.get(
    '/artista/:id/editar', 
    async (req, res) => {
        const id = req.params.id;
        const artista = await Artista.findByPk(id, {raw: true});

        if (!artista) {
            return res.status(404).send('Artista não encontrado');
        }

        res.render('editarArtista', { artista });
    }
);

app.put(
    '/artista/:id/editar', 
    async (req, res) => {
        const id = req.params.id;
        const artista = await Artista.findByPk(id);

        if (!artista) {
            return res.status(404).send('Artista não encontrado');
        }

        artista.nome = req.body.nome;
        artista.anoNascimento = req.body.anoNascimento;
        artista.nomeArtistico = req.body.nomeArtistico;

     await artista.save();

        res.redirect('/artistas');
    }
);

app.delete(
    '/artista/:id/delete', 
    async (req, res) => {
        const id = req.params.id;
        const artista = await Artista.findByPk(id);

        if (!artista) {
            return res.status(404).send('Artista não encontrado');
        }

        await artista.destroy();

        res.redirect('/artistas');
    }
);


async function conectarBD(){
    try{
        await sequelize.sync()
        console.log('Conexão com o banco estabelecida!')
    } catch (erro) {
        console.error('Erro ao conectar o banco:', erro)
    }
}

conectarBD()

app.listen(
    3000,
    () => console.log('Servidor rodando!')
)