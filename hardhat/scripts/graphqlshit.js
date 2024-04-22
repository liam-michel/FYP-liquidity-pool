import {request, gql} from 'graphql-request';
const endpoint = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';

const query = gql`
  query getSwaps($poolAddress: String!) {
    swaps(first: 10, where: { pair: $poolAddress }) {
      id
      transaction {
        id
        blockNumber
        timestamp
      }
      sender
      amount0In
      amount0Out
      amount1In
      amount1Out
      to
    }
  }
`;

const variables = {
  poolAddress: "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852" // Replace this with the actual pool address
};

async function fetchSwaps() {
  try {
    const data = await request(endpoint, query, variables);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

fetchSwaps();
