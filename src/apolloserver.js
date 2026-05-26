import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

const typeDefs = `#graphql
  type Post {
    id: ID!
    title: String!
    body: String!
    userId: Int!
    commentsCount: Int!
  }
  type PostsResult {
    posts: [Post]!
    totalCount: Int!
  }
  type Comment {
    id: ID!
    name: String!
    email: String!
    body: String!
  }
  type Query {
    posts(page: Int!, limit: Int!): PostsResult!
    comments(postId: ID!): [Comment]!
  }
`;

const resolvers = {
  Query: {
    posts: async (_, { page, limit }) => {
      const { data: posts } = await axios.get(
        `https://jsonplaceholder.typicode.com/posts?_page=${page}&_limit=${limit}`
      );
      const postsWithCount = await Promise.all(
        posts.map(async (post) => {
          try {
            const { data: comments } = await axios.get(
              `https://jsonplaceholder.typicode.com/posts/${post.id}/comments`
            );
            return { ...post, commentsCount: comments.length };
          } catch {
            return { ...post, commentsCount: 0 };
          }
        })
      );
      return { posts: postsWithCount, totalCount: 100 };
    },
    comments: async (_, { postId }) => {
      const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/posts/${postId}/comments`
      );
      return data;
    },
  },
};

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();

  app.use(
    '/graphql',
    expressMiddleware(server),
  );

  app.listen(4000, () => {
    console.log('🚀 Apollo Server ready at http://localhost:4000/graphql');
  });
}

startServer();