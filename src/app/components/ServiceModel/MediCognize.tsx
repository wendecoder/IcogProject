import React, { useEffect, useState } from 'react';
import { useBalance } from '../../context/BalanceContext';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-toastify';

interface Disease {
  id: number;
  name: string;
}

interface MedicognizePopupProps {
  onClose: () => void;
}

const MedicognizePopup: React.FC<MedicognizePopupProps> = ({ onClose }) => {
  const [selectedDisease, setSelectedDisease] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [Predictionresult, setPredictionResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { userBalance, updateUserBalance } = useBalance();
  const { data: session} = useSession();
  const userEmail = session?.user?.email;

  const diseases: Disease[] = [
    { id: 1, name: 'Diabetic Retinopathy Detection' },
    { id: 2, name: 'Skin Cancer Detection' },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files && event.target.files[0];
    if(imageFile){
      setSelectedImage(imageFile);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !userEmail) {
      return;
    }    
    
    try{
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('type', selectedDisease);

      const response = await axios.post('http://127.0.0.1:8000/medicognize/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      if(response.data.prediction){
        setPredictionResult(response.data.prediction);
        setError(null);
        // try {
        //   const formData = new FormData();
        //   formData.append('image', selectedImage);
        //   formData.append('userEmail', userEmail || '');
        //   formData.append('type', selectedDisease || ''); 
        //   formData.append('result', Predictionresult || '');
    
        //   const response = await axios.post(`/api/services/medicognize`, formData, {
        //     headers: {
        //       'Content-Type': 'multipart/form-data',
        //     },
        //   });
    
        //   if (response.data.message) {
        //     // Data inserted successfully
        //     console.log("Inserted Successfully!!!");
        //   }
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
        // } catch (error) {
        //   console.error('An error occurred while uploading:', error);
        //   setError('An error occurred while uploading');
        // }
      }
    }
    catch (error){
      console.error('An error occurred while uploading:', error);
      setError('An error occurred while uploading');
    }
    
  };

  useEffect(() => {
      const fetchData = async () => {
        try {
          const formData = new FormData();
          formData.append('image', selectedImage as File);
          formData.append('userEmail', userEmail || '');
          formData.append('type', selectedDisease || ''); 
          formData.append('result', Predictionresult || '');
    
          const response = await axios.post(`/api/services/medicognize`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
    
          if (response.data.message) {
            // Data inserted successfully
            console.log("Inserted Successfully!!!");
          }
        } catch (error) {
          console.log("Couldn't insert the data in the database:", error);
        }
      };

      fetchData();
    }, [Predictionresult]
  )
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-xl font-semibold mb-2">Medicognize</h2>
        <p className="text-gray-600 mb-4">
          Medicognize is an AI-powered diagnostic tool that can classify various diseases from images.
        </p>
        <p className="text-red-500 mb-4">
          Note: Medicognize is trained on a limited dataset and may not provide accurate results for all cases.
        </p>
        <p className="mb-2">Select the type of disease:</p>
        <select
          className="w-full p-2 border rounded-lg mb-4"
          value={selectedDisease}
          onChange={(e) => setSelectedDisease(e.target.value)}
        >
          <option value="">Select a disease</option>
          {diseases.map((disease) => (
            <option key={disease.id} value={disease.name}>
              {disease.name}
            </option>
          ))}
        </select>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="mb-4"
        />
        {Predictionresult && (
          <p className="mt-4">Prediction Result: {Predictionresult}</p>
        )}
        {error && (
          <p className="mt-4 text-red-500">{error}</p>
        )}
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg"
          onClick={handleSubmit}
        >
          Diagnose
        </button>
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

export default MedicognizePopup;
