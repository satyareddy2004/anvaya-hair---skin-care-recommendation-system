# ANVAYA – Hair & Skin Care Recommendation System

### A Full-Stack Machine Learning-Based Personalized Hair and Skin Care Recommendation Platform

**Machine Learning | TensorFlow | MobileNetV2 | Python | Node.js | Express.js | MongoDB | JavaScript | HTML | CSS**

ANVAYA is a full-stack, machine learning-based web application developed to provide personalized hair and skin care recommendations using user questionnaires and image analysis.

The system combines **commercial beauty products and natural home remedies**, allowing users to explore care solutions tailored to their individual hair or skin types, concerns, and preferences.

Developed as a final-year B.Tech Data Science major project at **Sreenidhi Institute of Science and Technology**, ANVAYA demonstrates the integration of machine learning, computer vision, backend development, database management, and interactive web application design.

---

## Project Overview

Finding suitable hair and skin care products can be challenging because individual needs vary based on skin type, hair texture, environmental factors, and specific concerns.

Many conventional beauty platforms emphasize product sales and generic recommendations rather than personalized assessments.

ANVAYA addresses this challenge through a recommendation platform that integrates:

- Machine learning-based image analysis
- Personalized hair and skin questionnaires
- Hair and skin concern identification
- Commercial product recommendations
- Natural and DIY remedy suggestions
- User authentication and profile management
- Shopping cart and checkout interfaces

The project aims to make personalized beauty and wellness guidance more accessible, affordable, and user-friendly.

## Key Features

### 1. User Authentication

- User registration and login
- Account management
- Password reset interface
- User information management through MongoDB

### 2. Personalized Hair Assessment

Users can specify their hair type and concerns.

**Hair types:** Straight, Wavy, Curly, Coily

**Hair concerns:** Dryness, Oiliness, Normal, Damage, Dandruff, Thinning

### 3. Personalized Skin Assessment

Users can provide information about their skin type and concerns.

**Skin types:** Oily, Dry, Normal, Combination, Sensitive

**Skin concerns:** Acne, Dryness, Normal, Aging, Pigmentation, Redness

### 4. Machine Learning-Based Image Analysis

The project incorporates an image analysis workflow using **TensorFlow and MobileNetV2**, a convolutional neural network architecture designed for efficient image feature extraction.

The proposed workflow analyzes uploaded hair or skin images alongside questionnaire responses to support personalized recommendations.

### 5. Commercial Product Recommendations

- Hair care products including shampoos, conditioners, and oils
- Skin care products including cleansers, moisturizers, and sunscreens
- Product images, descriptions, and prices
- Searchable product recommendations
- Add-to-cart functionality

### 6. Natural Remedy Recommendations

The application also provides natural care alternatives, including:

- Homemade hair masks and oils
- Natural shampoos and conditioners
- DIY facial cleansers and toners
- Natural moisturizers and skin masks
- Ingredients, preparation instructions, and usage guidance

### 7. Shopping Cart and Checkout

- Add products to cart
- Adjust quantities
- Remove products
- View calculated order totals
- Navigate through a checkout and confirmation interface

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js, Express.js |
| Machine Learning | Python, TensorFlow, MobileNetV2 |
| Database | MongoDB, Mongoose |
| Image Upload | Multer |
| Email Functionality | Nodemailer |
| Development Tools | Visual Studio Code, npm, nodemon |
| Data Exchange | JSON |

## Machine Learning Methodology

ANVAYA's machine learning methodology combines user-provided information with image analysis to support personalized hair and skin care recommendations.

### Image Analysis

The project uses **MobileNetV2**, a lightweight convolutional neural network architecture, for image-based feature extraction and condition analysis.

The methodology includes:

1. Collecting user responses through hair or skin questionnaires.
2. Accepting uploaded images through the web application.
3. Processing images using a Python-based machine learning workflow.
4. Using MobileNetV2 for image analysis.
5. Combining image-derived information with questionnaire responses.
6. Identifying relevant hair or skin concerns.
7. Presenting suitable commercial products or natural remedies.

### Recommendation Approach

The system follows a hybrid recommendation approach combining:

- Questionnaire-based personalization
- Machine learning-assisted image analysis
- Condition-specific product suggestions
- Natural remedy alternatives

This allows users to choose between commercial products and DIY treatments based on their preferences.

### Model Performance

The project report documents **over 78% accuracy in initial image-analysis testing**.

This is a reported project result rather than an independently reproduced benchmark. Additional evaluation across more diverse images and conditions would be valuable for improving generalization.

## Application Workflow

```text
User Registration / Login
          |
          v
Select Hair Care or Skin Care
          |
          v
Complete Personalized Questionnaire
          |
          v
Upload Hair / Skin Image
          |
          v
Machine Learning Image Analysis
          |
          v
Identify Hair / Skin Concerns
          |
          v
Personalized Recommendation Interface
          |
          +-------------------------+
          |                         |
          v                         v
 Commercial Products         Natural Remedies
          |                         |
          v                         v
Browse / Search Products     View DIY Instructions
          |
          v
Add Products to Cart
          |
          v
Checkout Interface
```

## System Architecture

ANVAYA follows a full-stack architecture with separate frontend, backend, machine learning, and database components.

**Frontend:** Provides the user interface for authentication, questionnaires, image uploads, product browsing, and cart management.

**Backend:** Uses Node.js and Express.js to handle application routes, user requests, image uploads, and data operations.

**Machine Learning:** Uses Python and TensorFlow-based image analysis to support personalized recommendations.

**Database:** Uses MongoDB with Mongoose for application data management.

The repository also includes UML diagrams documenting the system design.

## Application Demonstration

The repository contains screenshots illustrating the application workflow, including:

- Homepage and user authentication
- Hair and skin questionnaires
- Image upload interface
- Commercial product recommendations
- Natural remedy suggestions
- Shopping cart and checkout confirmation

**Screenshots:** [View Application Screenshots](Screen%20Shots)

**UML Diagrams:** [View UML Diagrams](UML%20Diagrams)

**Demo Video:** [Watch Application Execution](Execution%20Video.mp4)

## Project Structure

```text
ANVAYA/
|
|-- backend/
|   |-- models/
|   |   |-- Analysis.js
|   |   |-- Cart.js
|   |   |-- User.js
|   |
|   |-- routes/
|   |   |-- analysis.js
|   |   |-- auth.js
|   |   |-- cart.js
|   |   |-- upload.js
|   |
|   |-- predict.py
|   |-- server.js
|   |-- package.json
|   |-- package-lock.json
|
|-- frontend/
|   |-- assets/
|   |-- index.html
|   |-- login.html
|   |-- newuser.html
|   |-- select.html
|   |-- hair-questions.html
|   |-- skin-questions.html
|   |-- upload.html
|   |-- recommendation.html
|   |-- recommendation-options.html
|   |-- natural-remedies.html
|   |-- cart.html
|   |-- checkout-success.html
|   |-- reset-password.html
|
|-- Screen Shots/
|-- UML Diagrams/
|-- Execution Video.mp4
|-- .gitignore
|-- README.md
```

## Local Setup

### Prerequisites

- Node.js and npm
- Python 3.8 or later
- MongoDB
- Python machine learning dependencies required by the prediction script

### 1. Clone the Repository

```bash
git clone <YOUR-REPOSITORY-URL>
cd <YOUR-REPOSITORY-FOLDER>
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure the Environment

Configure the MongoDB connection and any email-related settings required by the backend.

Keep database credentials, email passwords, and other secrets outside version control.

### 4. Install Python Dependencies

Install the required Python libraries, including the compatible TensorFlow version and any additional packages imported by `predict.py`.

Ensure that any model files required by the prediction workflow are available locally.

### 5. Start the Application

From the backend directory:

```bash
node server.js
```

Open the local address configured by the Express server. The application was demonstrated at:

```text
http://localhost:3000
```

**Note:** Complete setup depends on the local MongoDB configuration, Python environment, and availability of required machine learning model files.

## Challenges and Learning Outcomes

This project provided practical experience in:

- Integrating machine learning with a full-stack web application
- Applying CNN-based image analysis to a recommendation use case
- Connecting Python-based prediction logic with a JavaScript backend
- Developing REST-style backend routes
- Designing MongoDB data models using Mongoose
- Implementing authentication and image-upload workflows
- Building interactive product recommendation interfaces
- Managing application state and shopping cart functionality
- Designing a user-centered system that combines multiple recommendation approaches

## Future Enhancements

Potential improvements include:

- Expanding and diversifying the image training dataset
- Improving model accuracy and evaluating performance across different hair and skin conditions
- Introducing more advanced personalized recommendation algorithms
- Incorporating weather and environmental information
- Expanding the commercial product and natural remedy databases
- Adding real-time progress tracking and recommendation feedback
- Enhancing accessibility and mobile responsiveness
- Integrating verified payment processing and order management
- Exploring professional dermatologist-reviewed guidance

## Disclaimer

ANVAYA is an academic machine learning and web development project. Its recommendations are intended for general informational and educational purposes and are not medical diagnoses or substitutes for professional dermatological advice.

---

**ANVAYA — Purely You**

*Personalized hair and skin care through machine learning and thoughtful recommendation design.*
