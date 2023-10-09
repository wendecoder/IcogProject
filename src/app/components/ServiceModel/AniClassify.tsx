import { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { useBalance } from '../../context/BalanceContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import useFetchUserBalance from '../../customHooks/useFetchUserBalance';
import useUpdateUserBalance from '../../customHooks/useUpdateUserBalance';

interface AniClassifyProps {
  onClose: () => void;
}

const AniClassify: React.FC<AniClassifyProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [predictedCategory, setPredictedCategory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userBalance, updateUserBalance } = useBalance();
  
  // Use the useSession hook to access user information
  const { data: session } = useSession();
  const userEmail = session?.user?.email;
  console.log(userEmail);
  

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !userEmail) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await axios.post<{ predicted_category: string }>(
        'http://127.0.0.1:8000/classify/',  // Adjust the endpoint URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Check if the predicted category is null or not
      if (response.data.predicted_category) {
        setPredictedCategory(response.data.predicted_category);
        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('userEmail', userEmail || ''); // User ID
          formData.append('result', predictedCategory || '');
    
          const response = await axios.post(`/api/services/aniclassify`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
    
          if (response.data.message) {
            // Data inserted successfully
            console.log("Inserted Successfully!!!");
          }
        } catch (error) {
          console.error('An error occurred while uploading:', error);
          setError('An error occurred while uploading');
        }

        // Update the user balance
        try {
          // Deduct the appropriate amount from the user's balance
          const deductionAmount = 10; // Adjust this as needed
          await updateUserBalance(userEmail, deductionAmount);
  
          // Show a success toast notification with the deducted amount
          toast.success(`Deducted ${deductionAmount} ETB from your balance`);
        } catch (error) {
          // Handle any errors that occur during balance update
          console.error('Error updating balance:', error);
          setError('Failed to update balance');
        }
      } else {
        setPredictedCategory(null);
        setError('The uploaded image is not an animal image');
      }
    } catch (error) {
      console.error('An error occurred while uploading:', error);
      setError('An error occurred while uploading');
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-50">
      <div className="max-w-md w-full p-6 bg-white shadow-md rounded-lg">
        <h1 className="text-2xl font-semibold mb-4">AniClassify: Animal Image Classification</h1>
        <p className="mb-4">Upload an image of an animal to classify its category.</p>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border rounded-md p-2 mb-4"
        />
        <button
          onClick={handleUpload}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-md"
        >
          Classify
        </button>
        {predictedCategory && (
          <p className="mt-4">Predicted Category: {predictedCategory}</p>
        )}
        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}

        {/* Display user balance */}
        {userBalance !== null && (
          <div className="mt-4">
            <p className="font-semibold">User Balance:</p>
            <p className="font-semibold rounded-md text-white bg-black w-32 p-5">{userBalance} PCT</p>
          </div>
        )}

        <button
          className="w-full mt-2 bg-gray-300 text-gray-700 py-2 rounded-lg"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AniClassify;
