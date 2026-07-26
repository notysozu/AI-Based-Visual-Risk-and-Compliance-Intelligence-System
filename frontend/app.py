import streamlit as st

st.set_page_config(
    page_title="Digital Twin AI",
    page_icon="🤖",
    layout="wide",
)

st.title("🤖 Digital Twin AI – Personal Life Simulation & Decision Assistant")
st.markdown("Welcome to your Digital Twin dashboard. Forecast outcomes of your choices in finances, habits, and studies.")

st.sidebar.header("Navigation")
menu = st.sidebar.radio("Select View", ["Overview", "Finances", "Habits & Studies", "Simulation & Forecasting"])

if menu == "Overview":
    st.subheader("User Overview")
    st.info("Digital twin initialized. Configure parameters or run a new simulation from the sidebar.")
elif menu == "Finances":
    st.subheader("Financial Tracking & Projection")
    st.write("Track income, expenses, and asset growth projections.")
elif menu == "Habits & Studies":
    st.subheader("Habits & Study Log")
    st.write("Track daily routines, productivity metrics, and study sessions.")
elif menu == "Simulation & Forecasting":
    st.subheader("What-If Simulation Engine")
    st.write("Simulate future outcomes based on different decisions and habit modifications.")
