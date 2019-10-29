const root = document.getElementById('root');

const { Component } = React;
const { HashRouter, Route, Link, Switch, Redirect } = ReactRouterDOM;



const API = 'https://acme-users-api-rev.herokuapp.com/api';



class App extends Component {
    constructor() {
        super()
        this.state = {
            user: {},
            notes: [],
            archived: [],
        }
    }

    async componentDidMount() {
        
        const fetchUser = async ()=> {
            const storage = window.localStorage;
            const userId = storage.getItem('userId'); 
            if(userId){
              try {
                return (await axios.get(`${API}/users/detail/${userId}`)).data;
              }
              catch(ex){
                storage.removeItem('userId');
                return fetchUser();
              }
            }
            const user = (await axios.get(`${API}/users/random`)).data;
            storage.setItem('userId', user.id);
          
            return user
          };
        const user = await fetchUser()
        this.setState({user})

        const getNotes = async() => {
            const notes = (await axios.get(`${API}/users/${this.state.user.id}/notes`)).data
            return notes;
        }
        const notes = await getNotes()
        this.setState({notes})
        const archived = notes.filter(note => note.archived)
        this.setState({archived})
        
    }


    render() {
        const { user, notes, archived } = this.state
        return (
            <HashRouter>
                <Route render = {props => <Nav {...props} notes = { notes } archived = { archived } />} />
                <Switch>
                    <Route path='/notes' render = {props => <Notes {...props} user = {user} notes = {notes} archived = {archived} />}/>
                    <Route path='/archive' render = {props => <Archive {...props} user = {user} notes = {notes} archived = {archived} />}/>
                    <Route path='/create' render = {props => <CreateNote {...props} user = {user} notes = {notes} archived = {archived} />}/>
                </Switch>
            </HashRouter>
        )
    }
}

const Nav = ({location, archived}) => {
    const {pathname} = location
    return (
        <nav>
            <Link to='notes' className = { pathname === '/notes' ? 'selected' : '' }>Notes</Link>
            <Link to='archive' className = { pathname === '/archive' ? 'selected' : '' }>Archived ({archived.length})</Link>
            <Link to='create' className = { pathname === '/create' ? 'selected' : '' }>Create</Link>
        </nav>
    )
}
// 'https://acme-users-api-rev.herokuapp.com/api';
// eslint-disable-next-line react/no-multi-comp
class CreateNote extends Component {
    constructor({user}) {
        super();
        this.state = {
            user,
            note: '',
        }
    }

    handleChange = ev => {
        this.setState({note: ev.target.value})
    }

    handleSubmit = async ev => {
        ev.preventDefault()
        console.log(this.state.user)
        const newNote = await axios.post(`${API}/users/${this.state.user.id}/notes`, {text: this.state.note})
        const newTextNote = newNote.data
        
    }

    render() {
        return (
            <form onSubmit = {this.handleSubmit}>
                <h1>Acme Note -- taker for {this.state.user.fullName} - fix later</h1>
                <input name='note' type="text" onChange = {this.handleChange}/>
                <button>Create</button>
            </form>
        )
    }
}

// eslint-disable-next-line react/no-multi-comp
class Notes extends Component {
    constructor({notes, user}) {
        super();
        this.state = {
            user,
            notes,
            notesText: []
        }
    }

    componentDidMount() {
        const liveNotes = this.state.notes.filter(note => note.archived === false);
        this.setState({notes: liveNotes})
        const notesText = liveNotes.map(note => note.text);
        this.setState({notesText})
    }


    handleSubmit = ev => {
        ev.preventdefault()
        // add functionality for each button later
    }

    render() {
        return (
            <form onSubmit = {this.handleSubmit}>
                <h1>Acme Note -- taker for {this.state.user.fullName}</h1>
                <ul>
                    {this.state.notesText.map((note, idx) => {
                    return (
                        <li key={idx}>{note}
                            <button>Archive</button>
                            <button>Destroy</button>
                        </li>
                        )}
                    )}
                </ul>
                
            </form>
        )
    }
}

// eslint-disable-next-line react/no-multi-comp
class Archive extends Component {
    constructor({archived, user}) {
        super();
        this.state = {
            user,
            archived,
            archivedText: [],
        }
    }

    componentDidMount() {
        const archivedText = this.state.archived.map(note => note.text);
        this.setState({archivedText})
    }

    handleSubmit = ev => {
        ev.preventdefault()
        
    }

    render() {
        return (
            <form onSubmit = {this.handleSubmit}>
                <h1>Acme Note -- taker for {this.state.user.fullName} - fix later</h1>
                <ul>
                    {this.state.archivedText.map((note, idx) => {
                    return (
                        <li key={idx}>{note}
                            <button>unarchive</button>
                            <button>destroy</button>
                        </li>
                        )}
                    )}
                </ul>
                
            </form>
        )
    }
}

ReactDOM.render(<App />, root);