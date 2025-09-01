#!/usr/bin/env python3
"""
Script to create sample risks for development and testing
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import random

# Add the backend directory to Python path
sys.path.append(str(Path(__file__).parent))

from app.database import get_db
from app.models.risk import Risk
from app.models.user import User

# Sample risk data
SAMPLE_RISKS = [
    {
        "title": "Data Breach - Customer Information",
        "description": "Risk of unauthorized access to customer personal and financial data, potentially leading to identity theft and regulatory penalties.",
        "likelihood": 4,
        "impact": 5,
        "category": "security",
        "risk_owner": "Sarah Johnson",
        "department": "IT Security",
        "location": "Headquarters",
        "root_cause": "Outdated security protocols and insufficient access controls",
        "mitigation_strategy": "Implement multi-factor authentication, regular security audits, and employee training",
        "contingency_plan": "Immediate incident response team activation, customer notification procedures",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=30),
        "review_date": datetime.now() + timedelta(days=7)
    },
    {
        "title": "Supply Chain Disruption",
        "description": "Critical supplier experiencing financial difficulties may cause production delays and increased costs.",
        "likelihood": 3,
        "impact": 4,
        "category": "operational",
        "risk_owner": "Mike Chen",
        "department": "Operations",
        "location": "Manufacturing Plant",
        "root_cause": "Over-reliance on single supplier, lack of backup options",
        "mitigation_strategy": "Develop multiple supplier relationships, increase inventory buffer",
        "contingency_plan": "Activate backup suppliers, adjust production schedules",
        "status": "in_progress",
        "target_date": datetime.now() + timedelta(days=45),
        "review_date": datetime.now() + timedelta(days=14)
    },
    {
        "title": "Regulatory Compliance Changes",
        "description": "New industry regulations requiring significant system modifications and process updates.",
        "likelihood": 5,
        "impact": 4,
        "category": "compliance",
        "risk_owner": "Lisa Rodriguez",
        "department": "Legal & Compliance",
        "location": "All Locations",
        "root_cause": "Evolving regulatory landscape, industry-wide changes",
        "mitigation_strategy": "Regular regulatory monitoring, proactive compliance planning",
        "contingency_plan": "Regulatory liaison engagement, compliance audit preparation",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=90),
        "review_date": datetime.now() + timedelta(days=21)
    },
    {
        "title": "Key Employee Departure",
        "description": "Risk of losing critical technical expertise and institutional knowledge if key personnel leave.",
        "likelihood": 3,
        "impact": 3,
        "category": "operational",
        "risk_owner": "David Thompson",
        "department": "Human Resources",
        "location": "Headquarters",
        "root_cause": "Competitive job market, lack of succession planning",
        "mitigation_strategy": "Knowledge transfer programs, cross-training initiatives",
        "contingency_plan": "External consultant engagement, accelerated hiring process",
        "status": "mitigated",
        "target_date": datetime.now() + timedelta(days=60),
        "review_date": datetime.now() + timedelta(days=30)
    },
    {
        "title": "Natural Disaster - Facility Damage",
        "description": "Risk of facility damage from earthquakes, floods, or severe weather events.",
        "likelihood": 2,
        "impact": 5,
        "category": "environmental",
        "risk_owner": "Jennifer Park",
        "department": "Facilities Management",
        "location": "West Coast Facility",
        "root_cause": "Geographic location in seismic zone, climate change effects",
        "mitigation_strategy": "Facility hardening, disaster recovery planning",
        "contingency_plan": "Backup facility activation, business continuity procedures",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=120),
        "review_date": datetime.now() + timedelta(days=30)
    },
    {
        "title": "Market Competition - New Entrant",
        "description": "New competitor entering market with disruptive technology or pricing model.",
        "likelihood": 4,
        "impact": 4,
        "category": "strategic",
        "risk_owner": "Robert Kim",
        "department": "Strategy",
        "location": "Market-wide",
        "root_cause": "Low barriers to entry, rapid technological advancement",
        "mitigation_strategy": "Innovation investment, customer relationship strengthening",
        "contingency_plan": "Pricing strategy adjustment, product differentiation",
        "status": "in_progress",
        "target_date": datetime.now() + timedelta(days=75),
        "review_date": datetime.now() + timedelta(days=14)
    },
    {
        "title": "Software System Failure",
        "description": "Critical business system experiencing downtime or data corruption.",
        "likelihood": 3,
        "impact": 4,
        "category": "technical",
        "risk_owner": "Alex Turner",
        "department": "IT Infrastructure",
        "location": "Data Center",
        "root_cause": "Aging infrastructure, insufficient redundancy",
        "mitigation_strategy": "System modernization, backup and recovery improvements",
        "contingency_plan": "Manual process activation, cloud backup restoration",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=60),
        "review_date": datetime.now() + timedelta(days=7)
    },
    {
        "title": "Financial Market Volatility",
        "description": "Economic uncertainty affecting investment returns and funding availability.",
        "likelihood": 4,
        "impact": 3,
        "category": "financial",
        "risk_owner": "Maria Garcia",
        "department": "Finance",
        "location": "Global",
        "root_cause": "Geopolitical tensions, economic policy changes",
        "mitigation_strategy": "Portfolio diversification, hedging strategies",
        "contingency_plan": "Cost reduction measures, alternative funding sources",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=45),
        "review_date": datetime.now() + timedelta(days=14)
    },
    {
        "title": "Reputation Damage - Social Media",
        "description": "Negative social media campaign or viral content damaging brand reputation.",
        "likelihood": 3,
        "impact": 4,
        "category": "reputational",
        "risk_owner": "Chris Wilson",
        "department": "Marketing",
        "location": "Online",
        "root_cause": "Social media amplification, rapid information spread",
        "mitigation_strategy": "Social media monitoring, crisis communication planning",
        "contingency_plan": "PR firm engagement, customer outreach campaigns",
        "status": "mitigated",
        "target_date": datetime.now() + timedelta(days=30),
        "review_date": datetime.now() + timedelta(days=7)
    },
    {
        "title": "Intellectual Property Theft",
        "description": "Risk of trade secrets or proprietary information being stolen by competitors.",
        "likelihood": 2,
        "impact": 5,
        "category": "security",
        "risk_owner": "Patricia Lee",
        "department": "Legal",
        "location": "All Locations",
        "root_cause": "Insider threats, inadequate security measures",
        "mitigation_strategy": "Access controls, employee background checks",
        "contingency_plan": "Legal action, competitive intelligence monitoring",
        "status": "open",
        "target_date": datetime.now() + timedelta(days=90),
        "review_date": datetime.now() + timedelta(days=21)
    },
    {
        "title": "Product Quality Issues",
        "description": "Manufacturing defects or quality control failures leading to product recalls.",
        "likelihood": 2,
        "impact": 4,
        "category": "operational",
        "risk_owner": "Kevin O'Brien",
        "department": "Quality Assurance",
        "location": "Manufacturing",
        "root_cause": "Equipment malfunction, human error in quality checks",
        "mitigation_strategy": "Automated quality control, employee training",
        "contingency_plan": "Product recall procedures, customer compensation",
        "status": "closed",
        "target_date": datetime.now() + timedelta(days=30),
        "review_date": datetime.now() + timedelta(days=7)
    },
    {
        "title": "Cybersecurity Attack - Ransomware",
        "description": "Malicious software encrypting company data and demanding payment for decryption.",
        "likelihood": 3,
        "impact": 5,
        "category": "security",
        "risk_owner": "Rachel Green",
        "department": "IT Security",
        "location": "Network-wide",
        "root_cause": "Phishing attacks, unpatched vulnerabilities",
        "mitigation_strategy": "Regular security updates, employee awareness training",
        "contingency_plan": "Backup restoration, incident response procedures",
        "status": "escalated",
        "target_date": datetime.now() + timedelta(days=15),
        "review_date": datetime.now() + timedelta(days=1)
    }
]

def create_sample_risks():
    """Create sample risks in the database"""
    
    try:
        # Get database session
        db = next(get_db())
        
        # Get existing users to assign as owners
        users = db.query(User).all()
        if not users:
            print("❌ No users found in database. Please create users first.")
            return
        
        # Check if risks already exist
        existing_risks = db.query(Risk).count()
        if existing_risks > 0:
            print(f"✅ {existing_risks} risks already exist in database.")
            print("To recreate sample risks, delete existing ones first.")
            return
        
        print("🚀 Creating sample risks...")
        
        created_risks = []
        for i, risk_data in enumerate(SAMPLE_RISKS, 1):
            # Randomly assign a user as owner
            owner = random.choice(users)
            
            # Create risk with legacy field compatibility
            risk = Risk(
                title=risk_data["title"],
                description=risk_data["description"],
                likelihood=risk_data["likelihood"],
                impact=risk_data["impact"],
                severity=risk_data["likelihood"],  # Map likelihood to severity
                probability=risk_data["impact"],   # Map impact to probability
                category=risk_data["category"],
                risk_owner=risk_data["risk_owner"],
                department=risk_data["department"],
                location=risk_data["location"],
                root_cause=risk_data["root_cause"],
                mitigation_strategy=risk_data["mitigation_strategy"],
                contingency_plan=risk_data["contingency_plan"],
                status=risk_data["status"],
                owner_id=owner.id,
                target_date=risk_data["target_date"],
                review_date=risk_data["review_date"]
            )
            
            db.add(risk)
            created_risks.append(risk)
            print(f"  ✅ Created risk {i}: {risk.title}")
        
        # Commit all risks
        db.commit()
        
        print(f"\n🎉 Successfully created {len(created_risks)} sample risks!")
        print("\n📊 Risk Categories Created:")
        categories = set(risk.category for risk in created_risks)
        for category in sorted(categories):
            count = sum(1 for risk in created_risks if risk.category == category)
            print(f"  • {category.title()}: {count} risks")
        
        print("\n🔍 Sample risks include:")
        print("  • Data Breach - Customer Information")
        print("  • Supply Chain Disruption")
        print("  • Regulatory Compliance Changes")
        print("  • Key Employee Departure")
        print("  • Natural Disaster - Facility Damage")
        print("  • Market Competition - New Entrant")
        print("  • Software System Failure")
        print("  • Financial Market Volatility")
        print("  • Reputation Damage - Social Media")
        print("  • Intellectual Property Theft")
        print("  • Product Quality Issues")
        print("  • Cybersecurity Attack - Ransomware")
        
    except Exception as e:
        print(f"❌ Error creating sample risks: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_sample_risks()
