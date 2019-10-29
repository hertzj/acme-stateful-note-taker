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


    update = (newNotes) => {
        this.setState({notes: newNotes});
    }

    updateDestroy = (notes) => {
        this.setState({notes})
    }

    updateArchive = (newArchive) => {
        this.setState({archived: newArchive})
    }

    render() {
        const { user, notes, archived } = this.state
        return (
            <HashRouter>
                <Route render = {props => <Nav {...props} notes = { notes } archived = { archived } />} />
                <Switch>
                    <Route path='/notes'
                        render = {props =>
                            <Notes {...props} user = {user} notes = {notes} archived = {archived} updateDestroy = {this.updateDestroy} updateArchive = {this.updateArchive} update = {this.update}/>}/>
                    <Route path='/archive'
                        render = {props =>
                            <Archive {...props} user = {user} notes = {notes} archived = {archived} updateArchive = {this.updateArchive} update = {this.update} updateDestroy = {this.updateDestroy} />}/>
                    <Route path='/create'
                        render = {props =>
                            <CreateNote {...props} user = {user} notes = {notes} archived = {archived} update = {this.update} />}/>
                    <Redirect to='/notes' />
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
    constructor({user, update, notes, archived}) {
        super();
        this.state = {
            user,
            note: '',
            notes,
            update,
            archived,
            status: false,
        }
    }

    handleChange = ev => {
        this.setState({note: ev.target.value})
    }

    handleSubmit = async ev => {
        ev.preventDefault()
        if ((this.state.notes.length + this.state.archived.length) > 4) {
            this.setState({status: true})
        }
        else if ((this.state.notes.length + this.state.archived.length) < 5) {
            this.setState({status: false})
        }
        const newNote = await axios.post(`${API}/users/${this.state.user.id}/notes`, {text: this.state.note});
        const newNoteData = newNote.data
        const { notes } = this.state;

        notes.push(newNoteData);

        this.setState({notes})
        this.state.update(notes);
        const input = document.querySelector('input');
        input.value = '';
        
        
    }

    render() {
        return (
            <form onSubmit = {this.handleSubmit}>
                <h1>Acme Note -- taker for {this.state.user.fullName}</h1>
                {this.state.status && (<span>A user can create at most 5 notes</span>)}
                <input name='note' type="text" onChange = {this.handleChange}/>
                <button>Create</button>
            </form>
        )
    }
}

// eslint-disable-next-line react/no-multi-comp
class Notes extends Component {
    constructor({notes, user, archived, updateDestroy, updateArchive, update}) {
        super();
        this.state = {
            user,
            notes,
            archived,
            updateDestroy,
            updateArchive,
            update,
        }
    }

    componentDidMount() {
        const liveNotes = this.state.notes.filter(note => note.archived === false);
        this.setState({notes: liveNotes})
        const notesText = liveNotes.map(note => note.text);
        this.setState({notesText})
    }

    destory = async (id, ev) => {
        const remove = await axios.delete(`${API}/users/${this.state.user.id}/notes/${id}`)
        const notes = this.state.notes.filter(note=> note.id !== id);
        this.state.updateDestroy(notes)
        this.setState({
            notes,
        })
    }

    archive = async (id) => {
        const archivedNote = await axios.put(`${API}/users/${this.state.user.id}/notes/${id}`, {archived: true});
        const archivedNoteData = archivedNote.data;

        const { archived } = this.state;
        archived.push(archivedNoteData);
        const notes = this.state.notes.filter(note=> note.id !== id);
        this.state.update(notes);
        this.state.updateArchive(archived);
        this.setState({
            notes,
        })
        


    }

    render() {
        return (
            <div>
                <h1>Acme Note -- taker for {this.state.user.fullName}</h1>
                <ul>
                    {this.state.notes.map((note, idx) => {
                    return (
                        <li key={note.id}>{note.text}
                            <button onClick = {() => this.archive(note.id)}>Archive</button>
                            <button onClick = {() => this.destory(note.id)}>Destroy</button>
                        </li>
                        )}
                    )}
                </ul>
                
            </div>
        )
    }
}

// eslint-disable-next-line react/no-multi-comp
class Archive extends Component {
    constructor({archived, user, updateArchive, notes, update}) {
        super();
        this.state = {
            user,
            notes,
            archived,
            updateArchive,
            update,
        }
    }

    destroy = async (id, ev) => {
        const remove = await axios.delete(`${API}/users/${this.state.user.id}/notes/${id}`);
        const { archived } = this.state
        const newArchive = archived.filter(note => note.id !== id);
        this.setState({archived: newArchive})
        this.state.updateArchive(newArchive)
    }

    unArchive = async id => {
        const archivedNote = await axios.put(`${API}/users/${this.state.user.id}/notes/${id}`, {archived: false});
        const archivedNoteData = archivedNote.data;

        const { archived } = this.state;
        const newArchive = archived.filter(note => note.id !== id);
        this.setState({archived: newArchive});
        this.state.updateArchive(newArchive);

        const { notes } = this.state;
        notes.push(archivedNoteData);
        this.state.update(notes)
        this.setState({
            notes,
        })
    }

    render() {
        return (
            <div>
                <h1>Acme Note -- taker for {this.state.user.fullName}</h1>
                <ul>
                    {this.state.archived.map((note, idx) => {
                    return (
                        <li key={idx}>{note.text}
                            <button onClick={() => this.unArchive(note.id)}>unarchive</button>
                            <button onClick={() => this.destroy(note.id)}>destroy</button>
                        </li>
                        )}
                    )}
                </ul>
                
            </div>
        )
    }
}

ReactDOM.render(<App />, root);