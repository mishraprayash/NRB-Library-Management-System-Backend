// Define theme colors for easier maintenance and branding changes
const theme = {
  primary: '#3498db',
  secondary: '#2c3e50',
  background: '#f5f5f5',
  text: '#333333',
  muted: '#7f8c8d',
};

// Base email styles used across all templates
export const baseStyles = `
      <style>
          body {
              font-family: 'Arial', sans-serif;
              line-height: 1.6;
              color: ${theme.text};
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: ${theme.background};
          }
          .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              padding: 25px;
          }
          .header {
              color: ${theme.secondary};
              font-size: 22px;
              margin-bottom: 15px;
              font-weight: bold;
          }
          .content {
              margin: 15px 0;
          }
          .button {
              background-color: ${theme.primary};
              color: white !important;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              font-weight: bold;
          }
          .button:hover {
              opacity: 0.9;
          }
          .footer {
              font-size: 14px;
              color: ${theme.muted};
              text-align: center;
              margin-top: 25px;
          }
          ul {
              padding-left: 20px;
          }
          /* Responsive design for mobile devices */
          @media only screen and (max-width: 480px) {
              .button {
                  display: block;
                  text-align: center;
                  width: 100%;
              }
          }
          [data-ogsc] .button {
              background-color: ${theme.primary} !important;
              color: white !important;
          }
      </style>
`;
