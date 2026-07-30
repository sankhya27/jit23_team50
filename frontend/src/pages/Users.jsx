import { useEffect, useMemo, useState } from "react";

import MainLayout from "../components/layout/MainLayout";

import {

    FaUsers,
    FaUserShield,
    FaUserTie,
    FaSearch,
    FaPlus,
    FaTrash,
    FaEnvelope,
    FaUser,
    FaCircle

} from "react-icons/fa";

import { toast } from "react-toastify";

import "../styles/users.css";

const API = "http://localhost:5001/api";

function authHeader() {

    const token = localStorage.getItem("token");

    return {

        Authorization: `Bearer ${token}`

    };

}

export default function Users() {

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");

    const [roleFilter, setRoleFilter] = useState("All");

    const [sortBy, setSortBy] = useState("username");

    const [showModal, setShowModal] = useState(false);

    const [creating, setCreating] = useState(false);

    const [form, setForm] = useState({

        username: "",

        email: "",

        password: "",

        role: "analyst"

    });

    useEffect(() => {

        loadUsers();

    }, []);

    async function loadUsers() {

        try {

            setLoading(true);

            const res = await fetch(

                `${API}/users`,

                {

                    headers: authHeader()

                }

            );

            const data = await res.json();

            setUsers(

                Array.isArray(data)

                    ? data

                    : data.users || []

            );

        }

        catch (err) {

            console.log(err);

            toast.error(

                "Unable to load users."

            );

        }

        finally {

            setLoading(false);

        }

    }

    async function createUser() {

        if (

            !form.username ||

            !form.email ||

            !form.password

        ) {

            toast.warning(

                "Please fill all fields."

            );

            return;

        }

        if (

            form.password.length < 6

        ) {

            toast.warning(

                "Password should contain at least 6 characters."

            );

            return;

        }

        try {

            setCreating(true);

            const res = await fetch(

                `${API}/users`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":"application/json",

                        ...authHeader()

                    },

                    body: JSON.stringify(form)

                }

            );

            const data = await res.json();

            if (!res.ok)

                throw new Error(

                    data.error ||

                    "Unable to create user."

                );

            toast.success(

                "User created successfully."

            );

            setShowModal(false);

            setForm({

                username:"",

                email:"",

                password:"",

                role:"analyst"

            });

            loadUsers();

        }

        catch(err){

            toast.error(err.message);

        }

        finally{

            setCreating(false);

        }

    }

    async function deleteUser(id,name){

        if(

            !window.confirm(

                `Delete ${name}?`

            )

        ) return;

        try{

            const res=await fetch(

                `${API}/users/${id}`,

                {

                    method:"DELETE",

                    headers:authHeader()

                }

            );

            const data=await res.json();

            if(!res.ok)

                throw new Error(

                    data.error

                );

            toast.success(

                "User deleted."

            );

            loadUsers();

        }

        catch(err){

            toast.error(

                err.message

            );

        }

    }

    const filteredUsers=useMemo(()=>{

        let list=[...users];

        if(search){

            const q=search.toLowerCase();

            list=list.filter(u=>

                u.username

                .toLowerCase()

                .includes(q)

                ||

                u.email

                .toLowerCase()

                .includes(q)

            );

        }

        if(roleFilter!=="All"){

            list=list.filter(

                u=>u.role===roleFilter

            );

        }

        switch(sortBy){

            case "role":

                list.sort(

                    (a,b)=>

                    a.role.localeCompare(b.role)

                );

                break;

            case "date":

                list.sort(

                    (a,b)=>

                    new Date(b.createdAt)-

                    new Date(a.createdAt)

                );

                break;

            default:

                list.sort(

                    (a,b)=>

                    a.username.localeCompare(

                        b.username

                    )

                );

        }

        return list;

    },[

        users,

        search,

        roleFilter,

        sortBy

    ]);

    const adminCount=

        users.filter(

            u=>u.role==="admin"

        ).length;

    const analystCount=

        users.filter(

            u=>u.role==="analyst"

        ).length;
        return (

    <MainLayout>

        <div className="users-page">

            <div className="users-header">

                <div>

                    <h1>

                        <FaUsers />

                        &nbsp; User Management

                    </h1>

                    <p>

                        Manage administrators and security analysts with
                        role-based access control.

                    </p>

                </div>

                <button

                    className="add-user-btn"

                    onClick={() => setShowModal(true)}

                >

                    <FaPlus />

                    &nbsp; Create User

                </button>

            </div>

            <div className="users-stats">

                <div className="stat-card">

                    <FaUsers className="stat-icon"/>

                    <div>

                        <small>Total Users</small>

                        <h2>

                            {users.length}

                        </h2>

                    </div>

                </div>

                <div className="stat-card">

                    <FaUserShield className="stat-icon admin"/>

                    <div>

                        <small>Administrators</small>

                        <h2>

                            {adminCount}

                        </h2>

                    </div>

                </div>

                <div className="stat-card">

                    <FaUserTie className="stat-icon analyst"/>

                    <div>

                        <small>Analysts</small>

                        <h2>

                            {analystCount}

                        </h2>

                    </div>

                </div>

            </div>

            <div className="users-toolbar">

                <div className="search-box">

                    <FaSearch />

                    <input

                        placeholder="Search username or email..."

                        value={search}

                        onChange={(e)=>

                            setSearch(

                                e.target.value

                            )

                        }

                    />

                </div>

                <select

                    value={roleFilter}

                    onChange={(e)=>

                        setRoleFilter(

                            e.target.value

                        )

                    }

                >

                    <option>

                        All

                    </option>

                    <option>

                        admin

                    </option>

                    <option>

                        analyst

                    </option>

                </select>

                <select

                    value={sortBy}

                    onChange={(e)=>

                        setSortBy(

                            e.target.value

                        )

                    }

                >

                    <option value="username">

                        Sort by Username

                    </option>

                    <option value="role">

                        Sort by Role

                    </option>

                    <option value="date">

                        Sort by Joined Date

                    </option>

                </select>

            </div>

            {

                loading ?

                <div className="loading-users">

                    Loading users...

                </div>

                :

                filteredUsers.length===0 ?

                <div className="empty-users">

                    <FaUsers />

                    <h3>

                        No users found

                    </h3>

                    <p>

                        Try changing the search or filter.

                    </p>

                </div>

                :

                <div className="users-table-wrapper">

                    <table className="users-table">

                        <thead>

                            <tr>

                                <th>User</th>

                                <th>Email</th>

                                <th>Role</th>

                                <th>Status</th>

                                <th>Joined</th>

                                <th>Actions</th>

                            </tr>

                        </thead>

                        <tbody>

                            {

                                filteredUsers.map(user=>(

                                    <tr

                                        key={user._id}

                                    >

                                        <td>

                                            <div className="user-cell">

                                                <div className="avatar">

                                                    {

                                                        user.username

                                                        .charAt(0)

                                                        .toUpperCase()

                                                    }

                                                </div>

                                                <div>

                                                    <strong>

                                                        {user.username}

                                                    </strong>

                                                </div>

                                            </div>

                                        </td>

                                        <td>

                                            <div className="email-cell">

                                                <FaEnvelope />

                                                {user.email}

                                            </div>

                                        </td>

                                        <td>

                                            <span

                                                className={`role ${user.role}`}

                                            >

                                                {

                                                    user.role

                                                }

                                            </span>

                                        </td>

                                        <td>

                                            <span className="status-badge">

                                                <FaCircle />

                                                Active

                                            </span>

                                        </td>

                                        <td>

                                            {

                                                new Date(

                                                    user.createdAt

                                                ).toLocaleDateString()

                                            }

                                        </td>

                                        <td>

                                            <button

                                                className="delete-user-btn"

                                                onClick={()=>

                                                    deleteUser(

                                                        user._id,

                                                        user.username

                                                    )

                                                }

                                            >

                                                <FaTrash />

                                                Delete

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            }

                        </tbody>

                    </table>

                </div>

            }
                        {

                showModal &&

                <div className="modal-overlay">

                    <div className="user-modal">

                        <h2>

                            <FaUser />

                            &nbsp; Create New User

                        </h2>

                        <input

                            type="text"

                            placeholder="Username"

                            value={form.username}

                            onChange={(e)=>

                                setForm({

                                    ...form,

                                    username:e.target.value

                                })

                            }

                        />

                        <input

                            type="email"

                            placeholder="Email Address"

                            value={form.email}

                            onChange={(e)=>

                                setForm({

                                    ...form,

                                    email:e.target.value

                                })

                            }

                        />

                        <input

                            type="password"

                            placeholder="Password"

                            value={form.password}

                            onChange={(e)=>

                                setForm({

                                    ...form,

                                    password:e.target.value

                                })

                            }

                        />

                        <small className="password-hint">

                            Password must contain at least 6 characters.

                        </small>

                        <select

                            value={form.role}

                            onChange={(e)=>

                                setForm({

                                    ...form,

                                    role:e.target.value

                                })

                            }

                        >

                            <option value="analyst">

                                Analyst

                            </option>

                            <option value="admin">

                                Administrator

                            </option>

                        </select>

                        <div className="modal-buttons">

                            <button

                                className="create-btn"

                                disabled={creating}

                                onClick={createUser}

                            >

                                {

                                    creating

                                    ?

                                    "Creating..."

                                    :

                                    "Create User"

                                }

                            </button>

                            <button

                                className="cancel-btn"

                                onClick={()=>

                                    setShowModal(false)

                                }

                            >

                                Cancel

                            </button>

                        </div>

                    </div>

                </div>

            }

        </div>

    </MainLayout>

);

}