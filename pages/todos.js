import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import styles from "../styles/Home.module.css";
import { useContext, useState, useEffect, createContext, useMemo } from "react";
import axios from "axios";
import { Component } from "react";

// this is for client
const useTodos = (ssrData) => {
  // Did we get any data from the server? If so put it in state and return
  // if not, make a client side request for it and return
  const [todos, setTodos] = useState(ssrData?.length || undefined);
  const [loadingTodos, setLoadingTodos] = useState(undefined);

  useEffect(() => {
    if (!ssrData || !ssrData?.length) {
      console.log(`Client fetching todos`);
      setLoadingTodos(true);
      axios
        .get("https://jsonplaceholder.typicode.com/todos")
        .then(({ data }) => {
          setTodos(data);
          setLoadingTodos(false);
        })
        .catch(({ data }) => {
          setTodos([]);
          setLoadingTodos(false);
        });
    }
  }, [ssrData]);

  return {
    todos,
    setTodos,
    loadingTodos,
  };
};

// Todos Context
const TodosContext = createContext();

// React component that uses the custom hook to fetch the todos data
// it then places that data in a context provider
// the context provider is what make the todos data available to any child
// within its section of the react tree
function TodosProvider(props) {
  const { todos, setTodos } = useTodos();
  const value = useMemo(() => [todos, setTodos], [todos]);
  return <TodosContext.Provider value={value} {...props} />;
}

// this is a helper component that will get the context from the Provider. It's like <Context.Consumer>
// this will help any child of the <TodosProvider /> get access to the todos data from the context API and not from props.
function useTodosContext() {
  const todosContext = useContext(TodosContext);
  if (!todosContext) {
    // if the call to get the contet from the provider doesn't work its because there is not context prodiver to consume
    // https://reactjs.org/docs/hooks-reference.html#usecontext
    throw new Error(`useTodosContext must be used within a Todos Provider!`);
  }
  return todosContext;
}

// This is the actual todos component, it is getting data through the context API via useTodosContext()
// it can do this because it is a child of the <TodosProvider />
// notice how this component doesnt take any props 😎
function TodosComponent() {
  const [todos, setTodos] = useTodosContext();
  return <div>The current todos list is {JSON.stringify(todos)}</div>;
}

function TodosWrapperCompoennt({ ssrData, error }) {
  // custom hook that is responsible for managing the app data
  // if we got data back from an server-side request, we can pass it to this hook
  // so that the hook know _not_ to fetch data from the client, rather put that data in react
  // state and make it available through "todos"
  const { todos, loadingTodos, setTodos } = useTodos(ssrData);
  return (
    <TodosProvider>
      <TodosComponent />
    </TodosProvider>
  );
}
export default class Todos extends Component {
  constructor({ ssrData, error }) {
    super();
  }

  componentDidMount() {
    if (this.props.ssrData) {
      this.setState({
        ssrData: this.props.ssrData,
      });
    } else if (this.props.error) {
      this.setState({
        error: this.props.error,
      });
    }
  }

  render() {
    const ssrData = this?.state?.ssrData;
    const error = this?.state?.error;

    if (error) {
      return <p>Error: {error}</p>;
    } else {
      return (
        <div className={styles.container}>
          <Head>
            <title>Create Next App</title>
            <meta name="description" content="Generated by create next app" />
            <link rel="icon" href="/favicon.ico" />
          </Head>

          <main className={styles.main}>
            <h1 className={styles.title}>Todos</h1>
            <Link href="/todos">Todos</Link>
            <Link href="/">Home</Link>
            <TodosWrapperCompoennt ssrData={ssrData} error={error} />
          </main>

          <footer className={styles.footer}>
            <a
              href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Powered by{" "}
              <span className={styles.logo}>
                <Image
                  src="/vercel.svg"
                  alt="Vercel Logo"
                  width={72}
                  height={16}
                />
              </span>
            </a>
          </footer>
        </div>
      );
    }
  }
}

// this is for server
Todos.getInitialProps = async ({ req }) => {
  // first we check to see if we are not in the browser
  if (!process.browser) {
    console.log(`Server side fetch for data`);
    // if we are in the server, make a server-side request to get out data
    let response;
    try {
      response = await axios.get("https://jsonplaceholder.typicode.com/todos");
    } catch (e) {
      // return the data to the page component through props
      return {
        ssrData: undefined,
        error: "could not fetch ssr data",
      };
    }

    // or return an error
    if (response.status === 200) {
      return {
        ssrData: response.data,
        error: undefined,
      };
    } else {
      return {
        ssrData: undefined,
        error: "could not fetch ssr data",
      };
    }
  }
  return {};
};
