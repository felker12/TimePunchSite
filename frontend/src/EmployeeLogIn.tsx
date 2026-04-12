import { useNavigate } from 'react-router-dom'
import './App.css'
import { useState, type ChangeEvent } from 'react';

function LogInPage() {
    //State variables for user name and password
    const [userID, setUserID] = useState<number | "">("");
    const [password, setPassword] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    //Event handlers for input changes
    const handleUserNameChange = (event: ChangeEvent<HTMLInputElement>) => {
        const val = event.target.valueAsNumber;
        setUserID(isNaN(val) ? "" : val);//If the input is not a valid number, set it to an empty string
    };
    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        setPassword(event.target.value);
    };

    //Navigation logic
    const navigate = useNavigate(); //Get the navigate function from react-router-dom
    const handleNavigation = () => {
        navigate('/employee-dashboard'); //Navigate to the employee dashboard and pass the userID as state
        //navigate('/employee-dashboard'); //todo change to this once the employee dashboard is set up to read the userID from localStorage instead of navigation state
    }

    //Validation logic
    const isPasswordValid = password.length == 0 || password.length >= 3; //dont show an error if password length is 0 because nothing has been entered yet
    const isFormValid = userID.toString().length > 0 && password.length >= 3;

    //Event handler for login button click
    const handleLogin = async () => {
        if (isLoading) return; //prevent duplicate requests
        if (!userID || password.length < 3) return; //Shouldn't be possible to click the button if the form is invalid, but this is just a safety check

        setIsLoading(true);

        try {
            const response = await fetch('/api/check-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: userID,       
                    password: password 
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                localStorage.setItem("token", result.token); //Store the token in localStorage for future authenticated requests

                handleNavigation();
            } else {
                alert(result.message || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Network Error:", error);
            alert("Server is offline. Check if your C# app is running!");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="app-container">
            <main className="main-content">
                <div className="card">
                    <div>
                        <div>
                            <p>Employee Log In</p>
                            <input
                                type="number"
                                id="employeeIDTextBox"
                                placeholder="ID" value={userID}
                                onChange={handleUserNameChange}
                            />
                        </div>

                        <div style={{ paddingTop: '5px' }}>
                            <input
                                type="password"
                                id="passwordTextBox"
                                placeholder="Password"
                                value={password}
                                onChange={handlePasswordChange}
                                style={{
                                    //If invalid, border is red. Otherwise, use a default gray.
                                    border: isPasswordValid ? '1px solid #ccc' : '2px solid red',
                                    outline: isPasswordValid ? 'initial' : 'none' //Removes the focus ring to show the red
                                }}
                            />

                            {/* Show a message only if the validation fails */}
                            {isPasswordValid == false && (
                                <p style={{ color: 'red', fontSize: '12px'}}>
                                    Password must be at least 3 characters.
                                </p>
                            )}
                        </div>

                        <div style={{ paddingTop: '5px', paddingBottom: '5px'}}>
                            <button
                                id="logInBtn"
                                disabled={!isFormValid || isLoading} /* Disable the button if the form is invalid or if a login attempt is in progress */
                                onClick={handleLogin}
                            >
                                {isLoading ? "Logging In..." : "Log In"} 
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default LogInPage;