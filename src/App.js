import React, {useContext, createContext, useState} from "react";
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    useHistory,
    useLocation
} from "react-router-dom";

export default function App() {
    return (
        <ProvideAuth>
            <Router>
                <div>
                    <AuthComponent/>
                    <Switch>
                        <Route path="/auth" exact>
                            <LoginPage/>
                        </Route>
                        <PrivateRoute path="/posts" exact>
                            <PostsPage/>
                        </PrivateRoute>
                    </Switch>
                </div>
            </Router>
        </ProvideAuth>
    );
}

const AuthService = {
    isAuthenticated: false,
    availableUsers: [{ userName: 'admin', password: '123' }],
    signin(authData) {
        const user = AuthService.availableUsers.find(({ userName }) => userName === authData.userName);
        return new Promise(function(resolve, reject) {
            if (authData?.password === user?.password) {
                AuthService.isAuthenticated = true;
                resolve(user);
            } else {
                AuthService.isAuthenticated = false;
                reject();
            }
        });
    },
    signout() {
        return new Promise(function(resolve) {
            AuthService.isAuthenticated = false;
            resolve();
        });
    }
};

// ======
const authContext = createContext();

function ProvideAuth({children}) {
    const auth = useProvideAuth();
    return (
        <authContext.Provider value={auth}>
            {children}
        </authContext.Provider>
    );
}

function useAuth() {
    return useContext(authContext);
}

function useProvideAuth() {
    const [user, setUser] = useState(null);
    const signin = (authData) => {
        return AuthService.signin(authData).then((user) => {
            setUser(user);
        });
    };
    const signout = () => {
        return AuthService.signout().then(() => {
            setUser(null);
        });
    };

    return { user, signin, signout };
}
// =======


function AuthComponent() {
    let auth = useAuth();
    return !auth?.user && <Redirect to="auth" />;
}

function PrivateRoute({children, ...rest}) {
    let auth = useAuth();
    return (
        <Route
            {...rest}
            render={({location}) =>
                auth.user ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: '/auth',
                            state: {from: location}
                        }}
                    />
                )
            }
        />
    );
}

function PostsPage() {
    let history = useHistory();
    let auth = useAuth();

    return <>
        <p>
            Welcome! {auth.user.userName}
            <br />
            <button
                onClick={() => {
                    auth.signout().then(() => {
                        history.push('/auth');
                    });
                }}
            >
                Sign out
            </button>
        </p>
        <h1>Posts page</h1>
        </>;
}

function LoginPage() {
    let history = useHistory();
    let location = useLocation();
    let auth = useAuth();

    let { from } = location.state || {from: { pathname: '/posts' }};
    let login = (e) => {
        const formData = new FormData(e.target.closest('form'));
        const authData = {
            userName: formData.get('userName'),
            password: formData.get('password')
        }

        auth.signin(authData).then(() => {
            history.replace(from);
        });
    };

    return (
        <div>
            <p>Login</p>

            <form onSubmit={(e) => e.preventDefault()}>
                <label>User name</label>
                <input type="text" name="userName"/>
                <br />
                <label>Password</label>
                <input type="password" name="password"/>
                <br />
                <button onClick={login}>Login</button>
            </form>
        </div>
    );
}
