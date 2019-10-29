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

    componentDidUpdate() {
        this.render()
    }

    update = (note) => {
        // // console.log('before update: ', this.state.notes)
        // const oldNotes = this.state.notes;
        // // console.log('note is:', note)
        // // console.log('oldNotes', oldNotes)
        // const notes = oldNotes.push(note)
        // // console.log('notes', notes)
        // // this.setState({notes})
        // // console.log('after update: ', this.state.notes)

        const { notes } = this.state;
        notes.push(note);
        this.setState({notes});
    }

    updateDestroy = (notes) => {
        this.setState({notes})
        // console.log(this.state.notes)
    }

    updateArchive = (newArchive) => {
        // const oldArchive = this.state.archived;
        // const archived = oldArchive.push(archivedNote);
        // this.setState({archived: archived}) // just uncommented htis

        // below works for just adding an individual archived note  - have f'n take in archivedNote
        // const { archived } = this.state;
        // archived.push(archivedNote);
        // this.setState({archived})

        this.setState({archived: newArchive})
    }

    render() {
        const { user, notes, archived } = this.state
        return (
            <HashRouter>
                <Route render = {props => <Nav {...props} notes = { notes } archived = { archived } />} />
                <Switch>
                    <Route path='/notes' render = {props => <Notes {...props} user = {user} notes = {notes} archived = {archived} updateDestroy = {this.updateDestroy} updateArchive = {this.updateArchive} />}/>
                    <Route path='/archive' render = {props => <Archive {...props} user = {user} notes = {notes} archived = {archived} />}/>
                    <Route path='/create' render = {props => <CreateNote {...props} user = {user} notes = {notes} archived = {archived} update = {this.update} />}/>
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
    constructor({user, update}) {
        super();
        this.state = {
            user,
            note: '',
            update,
        }
    }

    handleChange = ev => {
        this.setState({note: ev.target.value})
    }

    handleSubmit = async ev => {
        ev.preventDefault()
        // console.log(this.state.user)
        const newNote = await axios.post(`${API}/users/${this.state.user.id}/notes`, {text: this.state.note});
        const newTextNote = newNote.data
        this.state.update(newTextNote);
        
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
    constructor({notes, user, archived, updateDestroy, updateArchive}) {
        super();
        this.state = {
            user,
            notes,
            // notesText: [],
            archived,
            updateDestroy,
            updateArchive,
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

    destory = async (id, ev) => {
        const remove = await axios.delete(`${API}/users/${this.state.user.id}/notes/${id}`)
        const notes = this.state.notes.filter(note=> note.id !== id);
        this.state.updateDestroy(notes)
        this.setState({
            notes,
        })
        // console.log(this.state.notes)
    }

    archive = async (id) => {
        // const archived = await axios.put(`${API}/users/${this.state.user.id}/notes/${id}`, {archived: true});
        // const archivedNote = archived.data;
        // const notes = this.state.notes.filter(note=> note.id !== id);
        // this.state.updateArchive(archivedNote)
        // this.setState({
        //     notes,
        // }) // the above is the old
        const archivedNote = await axios.put(`${API}/users/${this.state.user.id}/notes/${id}`, {archived: true});
        const archivedNoteData = archivedNote.data;
        // const notes = this.state.notes.filter(note=> note.id !== id);
        // this.state.updateArchive(archivedNoteData)
        // this.setState({
        //     notes,
        // })

        const { archived } = this.state;
        archived.push(archivedNoteData);
        const notes = this.state.notes.filter(note=> note.id !== id);
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
    constructor({archived, user}) {
        super();
        this.state = {
            user,
            archived,
            archivedText: [],
        }
    }

    componentDidMount() {
        // const archivedText = this.state.archived.map(note => note.text);
        // this.setState({archivedText})
    }

    handleSubmit = ev => {
        ev.preventdefault()
        
    }

    destroy = async (id, ev) => {
        const remove = await axios.delete(`${API}/users/${this.state.user.id}/notes/${id}`);
        const archived = this.state.archived.filter(note => note.id !== id);
        this.setState({archived})
    }

    render() {
        return (
            <div>
                <h1>Acme Note -- taker for {this.state.user.fullName} - fix later</h1>
                <ul>
                    {this.state.archived.map((note, idx) => {
                    return (
                        <li key={idx}>{note.text}
                            <button>unarchive</button>
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