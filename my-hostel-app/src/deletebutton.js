import React from "react";
import axios from "axios";
import { useAuth } from "./AuthContext"; 

const DeleteAccount = () => {
    const { user, logout } = useAuth();

    const handleDelete = async () => {
        if (!user || !user.id) {
            console.error("User ID is undefined");
            alert("Error: Unable to delete account. User ID is missing.");
            return;
        }

        const userId = user.id;
        try {
            const response = await axios.delete(`http://localhost:3002/api/delete-account/${userId}`);
            console.log("Delete response:", response.data);
            alert("Account deleted successfully.");
            logout(); // Logout the user after account deletion
        } catch (error) {
            console.error("Error deleting account:", error);
            alert("Failed to delete account. Please try again.");
        }
    };

    return (
        <button class="action-button" onClick={handleDelete}>Delete Account</button>
    );
};

export default DeleteAccount;
