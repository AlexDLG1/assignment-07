import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const Curso = sequelize.define(
  'Curso',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    creditos: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    docente: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jornada: {
      type: DataTypes.STRING,
      allowNull: false
    },
    aula: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    tableName: 'cursos',
    timestamps: false
  }
);

const Estudiante = sequelize.define(
  'Estudiante',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    carnet: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    edad: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    promedio: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    cursoId: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  },
  {
    tableName: 'estudiantes',
    timestamps: false
  }
);

Curso.hasMany(Estudiante, { foreignKey: 'cursoId', as: 'estudiantes' });
Estudiante.belongsTo(Curso, { foreignKey: 'cursoId', as: 'curso' });

const typeDefs = `#graphql
  type Curso {
    id: ID!
    nombre: String!
    codigo: String!
    creditos: Int!
    docente: String!
    jornada: String!
    aula: String!
    estudiantes: [Estudiante!]!
  }

  type Estudiante {
    id: ID!
    nombre: String!
    carnet: String!
    correo: String!
    edad: Int!
    activo: Boolean!
    promedio: Float!
    cursoId: Int!
    curso: Curso
  }

  type Query {
    cursos: [Curso!]!
    curso(id: ID!): Curso
    estudiantes: [Estudiante!]!
    estudiante(id: ID!): Estudiante
  }
`;

const resolvers = {
  Query: {
    cursos: async () => await Curso.findAll(),
    curso: async (_, { id }) => await Curso.findByPk(id),
    estudiantes: async () => await Estudiante.findAll(),
    estudiante: async (_, { id }) => await Estudiante.findByPk(id)
  },
  Curso: {
    estudiantes: async (parent) => {
      return await Estudiante.findAll({
        where: { cursoId: parent.id }
      });
    }
  },
  Estudiante: {
    curso: async (parent) => {
      return await Curso.findByPk(parent.cursoId);
    }
  }
};

async function seedDatabase() {
  await sequelize.sync();

  const totalCursos = await Curso.count();

  if (totalCursos === 0) {
    const curso1 = await Curso.create({
      nombre: 'Bases de Datos',
      codigo: 'BD101',
      creditos: 5,
      docente: 'Ing. López',
      jornada: 'Matutina',
      aula: 'A-12'
    });

    const curso2 = await Curso.create({
      nombre: 'Programación Web',
      codigo: 'PW202',
      creditos: 4,
      docente: 'Ing. Morales',
      jornada: 'Vespertina',
      aula: 'B-05'
    });

    await Estudiante.bulkCreate([
      {
        nombre: 'Carlos Pérez',
        carnet: '2026001',
        correo: 'carlos@example.com',
        edad: 20,
        activo: true,
        promedio: 82.5,
        cursoId: curso1.id
      },
      {
        nombre: 'Ana Ramírez',
        carnet: '2026002',
        correo: 'ana@example.com',
        edad: 21,
        activo: true,
        promedio: 90.3,
        cursoId: curso2.id
      },
      {
        nombre: 'Luis Gómez',
        carnet: '2026003',
        correo: 'luis@example.com',
        edad: 19,
        activo: false,
        promedio: 75.8,
        cursoId: curso1.id
      }
    ]);
  }
}

async function startServer() {
  await seedDatabase();

  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );

 const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
});