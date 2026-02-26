import { useState } from "react";

export default function Login({ onLogin }) {

const [email,setEmail]=useState("viewer@company.com")

return(

<div>

<h2>Login</h2>

<select onChange={e=>setEmail(e.target.value)}>

<option>viewer@company.com</option>
<option>steward@company.com</option>
<option>data.owner@company.com</option>
<option>admin@company.com</option>

</select>

<button onClick={()=>onLogin(email)}>Login</button>

</div>

)

}
