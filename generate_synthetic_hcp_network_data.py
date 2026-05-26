"""Generate deterministic synthetic data for the HCP Network Intelligence demo.

Produces six source Excel files plus a precomputed canonical JSON bundle that the
static web app loads without any backend.
"""

from __future__ import annotations

import json
import math
import os
import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import pandas as pd
from openpyxl.utils import get_column_letter

SEED = 42
random.seed(SEED)

OUT_DIR = Path(__file__).resolve().parent
DATA_JS_PATH = OUT_DIR / "assets" / "data" / "demo_data.js"

# ---------------------------------------------------------------------------
# Reference dictionaries
# ---------------------------------------------------------------------------

SPECIALTIES = [
    "Vascular Neurology",
    "Neurology",
    "Interventional Neurology",
    "Neurosurgery",
    "Internal Medicine",
    "Cardiology",
    "Family Medicine",
    "Emergency Medicine",
    "Hospital Medicine",
    "Geriatrics",
    "Hematology",
    "Rehabilitation Medicine",
]

CREDENTIALS = ["MD", "MD, PhD", "MD, MPH", "DO", "MD, FAHA", "MD, FAAN"]

FIRST_NAMES = [
    "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
    "William", "Elizabeth", "David", "Barbara", "Richard", "Susan", "Joseph",
    "Jessica", "Thomas", "Karen", "Charles", "Nancy", "Christopher", "Margaret",
    "Daniel", "Lisa", "Matthew", "Sandra", "Anthony", "Ashley", "Mark", "Dorothy",
    "Donald", "Kimberly", "Steven", "Donna", "Paul", "Emily", "Andrew", "Carol",
    "Joshua", "Michelle", "Kenneth", "Amanda", "Kevin", "Helen", "Brian", "Deborah",
    "George", "Stephanie", "Edward", "Rebecca", "Ronald", "Sharon", "Timothy",
    "Laura", "Jason", "Cynthia", "Jeffrey", "Amy", "Ryan", "Kathleen", "Jacob",
    "Angela", "Gary", "Shirley", "Nicholas", "Brenda", "Eric", "Pamela", "Stephen",
    "Nicole", "Jonathan", "Samantha", "Larry", "Katherine", "Justin", "Christine",
    "Scott", "Catherine", "Brandon", "Virginia", "Frank", "Debra", "Benjamin",
    "Rachel", "Gregory", "Janet", "Samuel", "Maria", "Raymond", "Heather", "Patrick",
    "Diane", "Alexander", "Julie", "Jack", "Joyce", "Dennis", "Victoria", "Jerry",
    "Kelly", "Tyler", "Christina", "Aaron", "Joan", "Henry", "Evelyn", "Jose",
    "Lauren", "Adam", "Judith", "Douglas", "Olivia", "Nathan", "Frances", "Peter",
    "Martha", "Zachary", "Cheryl", "Kyle", "Megan", "Walter", "Andrea", "Harold",
    "Hannah", "Jeremy", "Jacqueline", "Ethan", "Ann", "Carl", "Gloria", "Keith",
    "Jean", "Roger", "Kathryn", "Gerald", "Alice", "Christian", "Teresa", "Terry",
    "Sara", "Sean", "Janice", "Arthur", "Doris", "Austin", "Madison", "Noah",
    "Julia", "Lawrence", "Grace", "Jesse", "Judy", "Joe", "Abigail",
    "Bryan", "Marie", "Billy", "Denise", "Jordan", "Beverly", "Albert", "Amber",
    "Dylan", "Theresa", "Bruce", "Marilyn", "Willie", "Danielle", "Gabriel",
    "Diana", "Alan", "Brittany", "Juan", "Natalie", "Logan", "Sophia", "Wayne",
    "Rose", "Roy", "Isabella", "Ralph", "Alexis", "Randy", "Kayla", "Eugene",
    "Charlotte", "Vincent", "Anna", "Russell", "Bobby", "Louis", "Philip", "Bradley",
    "Arun", "Sarah", "Maria", "Kevin", "Priya", "Wei", "Hiroshi", "Sergio",
    "Elena", "Omar", "Aisha", "Diego", "Yuki", "Anika", "Mateo", "Layla",
]

LAST_NAMES = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
    "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
    "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
    "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
    "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell",
    "Mitchell", "Carter", "Roberts", "Gomez", "Phillips", "Evans", "Turner",
    "Diaz", "Parker", "Cruz", "Edwards", "Collins", "Reyes", "Stewart", "Morris",
    "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan", "Cooper",
    "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox",
    "Ward", "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett",
    "Gray", "Mendoza", "Ruiz", "Hughes", "Price", "Alvarez", "Castillo", "Sanders",
    "Patel", "Lin", "Shaw", "Chen", "Singh", "Patel", "Kumar", "Khan", "Park",
    "Wong", "Tan", "Sharma", "Rao", "Bhatt", "Mehta", "Iyer", "Joshi",
]

MIDDLE_INITIALS = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "P", "R", "S", "T", "W"]

STATES = [
    ("OH", "Cleveland", "Midwest"),
    ("OH", "Columbus", "Midwest"),
    ("OH", "Cincinnati", "Midwest"),
    ("MI", "Detroit", "Midwest"),
    ("MI", "Ann Arbor", "Midwest"),
    ("MI", "Grand Rapids", "Midwest"),
    ("IL", "Chicago", "Midwest"),
    ("IL", "Springfield", "Midwest"),
    ("IN", "Indianapolis", "Midwest"),
    ("WI", "Milwaukee", "Midwest"),
    ("PA", "Pittsburgh", "Northeast"),
    ("PA", "Philadelphia", "Northeast"),
    ("NY", "New York", "Northeast"),
    ("NY", "Rochester", "Northeast"),
    ("MA", "Boston", "Northeast"),
    ("NC", "Charlotte", "Southeast"),
    ("NC", "Durham", "Southeast"),
    ("GA", "Atlanta", "Southeast"),
    ("FL", "Miami", "Southeast"),
    ("TX", "Houston", "South"),
    ("TX", "Dallas", "South"),
    ("CA", "Los Angeles", "West"),
    ("CA", "San Francisco", "West"),
    ("WA", "Seattle", "West"),
]

STREET_NAMES = [
    "Lakeshore Dr", "University Ave", "Medical Pkwy", "Main St", "Cedar Rd",
    "Oak Blvd", "Stroke Center Way", "Riverside Dr", "Hospital Rd", "Campus Cir",
    "Health Sciences Blvd", "Memorial Pkwy", "Vascular Way", "Innovation Dr",
]

TOPICS = [
    "ischemic stroke",
    "TIA",
    "secondary prevention",
    "antiplatelet therapy",
    "atrial fibrillation",
    "cerebrovascular imaging",
    "endovascular thrombectomy",
    "anticoagulation",
    "stroke rehabilitation",
    "telestroke",
    "lipid management",
    "carotid stenosis",
]

JOURNALS = [
    "Stroke", "JAMA Neurology", "Neurology", "Lancet Neurology", "NEJM",
    "Circulation", "International Journal of Stroke", "Annals of Neurology",
    "Journal of Stroke and Cerebrovascular Diseases", "Frontiers in Neurology",
]

TRIAL_ROLES = ["PI", "Site Investigator", "Collaborator", "Steering Committee", "Sub-Investigator"]

CONTENT_TOPICS = [
    "ischemic stroke", "secondary prevention", "antithrombotic therapy",
    "AF management", "guideline updates", "thrombectomy", "post-stroke care",
    "telestroke", "patient adherence",
]

OWNER_TEAMS = ["MSL Stroke", "Field Sales", "Medical Affairs", "Market Access", "KAM Health Systems"]

# ---------------------------------------------------------------------------
# IDN / HCO structure
# ---------------------------------------------------------------------------

@dataclass
class HCO:
    source_hco_id: str
    hco_name: str
    hco_alias: str
    hco_type: str
    parent_hco_id: str | None
    parent_idn_name: str | None
    facility_type: str
    stroke_center_level: str | None
    bed_count: int
    address: str
    city: str
    state: str
    region: str
    network_status: str
    account_priority_flag: str
    source_last_updated: str

@dataclass
class HCP:
    source_hcp_id: str
    npi: str | None
    first_name: str
    middle_name: str
    last_name: str
    full_name: str
    credentials: str
    primary_specialty: str
    secondary_specialty: str | None
    address_line_1: str
    city: str
    state: str
    zip: str
    phone: str
    email: str
    license_state: str
    active_status: str
    source_last_updated: str
    # archetype hints set later
    archetype_hint: str | None = None
    is_hero: bool = False
    home_hco_id: str | None = None

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def npi_pool(n: int, missing_rate: float = 0.03) -> list[str | None]:
    npis: list[str | None] = []
    seed = 1_700_000_000
    for i in range(n):
        if random.random() < missing_rate:
            npis.append(None)
        else:
            npis.append(str(seed + i))
    return npis

def fmt_date(d: date) -> str:
    return d.strftime("%Y-%m-%d")

def random_date(start: date, end: date) -> date:
    delta = (end - start).days
    return start + timedelta(days=random.randint(0, delta))

def make_email(first: str, last: str, hco_alias: str | None = None) -> str:
    domain = (hco_alias or "healthnet").replace(" ", "").lower()
    return f"{first.lower()}.{last.lower()}@{domain}.org"

def make_phone() -> str:
    return f"({random.randint(200,989)}) {random.randint(200,989)}-{random.randint(1000,9999)}"

def make_zip() -> str:
    return f"{random.randint(10000, 99999)}"

def percentile(values: list[float], v: float) -> float:
    if not values:
        return 0.0
    s = sorted(values)
    below = sum(1 for x in s if x <= v)
    return round(below / len(s) * 100, 1)

# ---------------------------------------------------------------------------
# Build HCO universe
# ---------------------------------------------------------------------------

def build_hcos() -> list[HCO]:
    hcos: list[HCO] = []
    today = date(2026, 5, 1)

    idns = [
        {
            "name": "Great Lakes Health Network",
            "alias": "GLHN",
            "region": "Midwest",
            "facility_count": 16,
            "priority": "Tier 1",
            "anchor_state": ("OH", "Cleveland"),
            "amc": True,
        },
        {
            "name": "Lakeland Mercy System",
            "alias": "Lakeland",
            "region": "Midwest",
            "facility_count": 10,
            "priority": "Tier 2",
            "anchor_state": ("MI", "Detroit"),
            "amc": True,
        },
        {
            "name": "Keystone Care Alliance",
            "alias": "Keystone",
            "region": "Northeast",
            "facility_count": 9,
            "priority": "Tier 1",
            "anchor_state": ("PA", "Pittsburgh"),
            "amc": True,
        },
        {
            "name": "Empire Northeast Health",
            "alias": "Empire NE",
            "region": "Northeast",
            "facility_count": 8,
            "priority": "Tier 2",
            "anchor_state": ("NY", "Rochester"),
            "amc": False,
        },
        {
            "name": "Sun Belt Medical Partners",
            "alias": "SunBelt",
            "region": "Southeast",
            "facility_count": 9,
            "priority": "Tier 2",
            "anchor_state": ("GA", "Atlanta"),
            "amc": True,
        },
        {
            "name": "Pacific Range Health",
            "alias": "PacRange",
            "region": "West",
            "facility_count": 7,
            "priority": "Tier 3",
            "anchor_state": ("CA", "San Francisco"),
            "amc": True,
        },
    ]

    hco_counter = 0
    for idn in idns:
        parent_id = f"HCO{1000 + len(hcos):05d}"
        hco_counter += 1
        hcos.append(HCO(
            source_hco_id=parent_id,
            hco_name=idn["name"],
            hco_alias=idn["alias"],
            hco_type="IDN",
            parent_hco_id=None,
            parent_idn_name=idn["name"],
            facility_type="System Parent",
            stroke_center_level=None,
            bed_count=0,
            address="",
            city=idn["anchor_state"][1],
            state=idn["anchor_state"][0],
            region=idn["region"],
            network_status="Active",
            account_priority_flag=idn["priority"],
            source_last_updated=fmt_date(today - timedelta(days=random.randint(5, 60))),
        ))

        levels_pool = ["Comprehensive", "Primary", "Acute Ready", "None"]
        # Ensure flagship IDN has at least 3-5 stroke centers and 1 AMC
        flagship = idn["alias"] == "GLHN"

        for i in range(idn["facility_count"]):
            hco_counter += 1
            facility_id = f"HCO{1000 + len(hcos):05d}"
            if flagship and i == 0:
                ftype = "Academic Medical Center"
                stroke_level = "Comprehensive"
                bed = random.randint(550, 850)
                name = f"{idn['alias']} University Medical Center"
                alias = f"{idn['alias']} UMC"
            elif flagship and i in (1, 2, 3):
                ftype = "Acute Care Hospital"
                stroke_level = "Comprehensive" if i == 1 else "Primary"
                bed = random.randint(280, 520)
                name = f"{idn['alias']} {['Lakeside', 'Riverside', 'Memorial'][i-1]} Hospital"
                alias = f"{idn['alias']} {['Lakeside', 'Riverside', 'Memorial'][i-1]}"
            else:
                if i % 4 == 0 and idn["amc"]:
                    ftype = "Academic Medical Center"
                    stroke_level = random.choice(["Comprehensive", "Primary"])
                    bed = random.randint(450, 800)
                elif i % 3 == 0:
                    ftype = "Community Hospital"
                    stroke_level = random.choice(["Primary", "Acute Ready", "None", None])
                    bed = random.randint(80, 220)
                else:
                    ftype = "Acute Care Hospital"
                    stroke_level = random.choice(levels_pool + [None, None])
                    bed = random.randint(150, 420)
                short = ["Mercy", "St. Vincent", "Memorial", "Highland", "Grandview", "Heritage", "Crossroads", "Northside", "Eastside", "Westview"][i % 10]
                name = f"{short} {ftype.split()[0]} Hospital - {idn['alias']}"
                alias = f"{short} {idn['alias']}"
            # vary city/state inside region for the flagship
            if flagship:
                city_choices = [("OH", "Cleveland"), ("OH", "Akron"), ("MI", "Detroit"), ("MI", "Ann Arbor"), ("OH", "Toledo")]
            else:
                city_choices = [(idn["anchor_state"][0], idn["anchor_state"][1])]
                for s, c, r in STATES:
                    if r == idn["region"]:
                        city_choices.append((s, c))
            state_chosen, city_chosen = random.choice(city_choices)
            # introduce some parent IDN mismatch noise
            parent_idn_name_field = idn["name"]
            if random.random() < 0.06 and not flagship:
                parent_idn_name_field = f"{idn['alias']} (legacy)"
            hcos.append(HCO(
                source_hco_id=facility_id,
                hco_name=name,
                hco_alias=alias,
                hco_type=ftype,
                parent_hco_id=parent_id,
                parent_idn_name=parent_idn_name_field,
                facility_type=ftype,
                stroke_center_level=stroke_level if random.random() > 0.08 else None,  # 8% missing
                bed_count=bed,
                address=f"{random.randint(100, 9999)} {random.choice(STREET_NAMES)}",
                city=city_chosen,
                state=state_chosen,
                region=idn["region"],
                network_status="Active",
                account_priority_flag=idn["priority"] if random.random() > 0.15 else "Standard",
                source_last_updated=fmt_date(today - timedelta(days=random.randint(5, 240))),
            ))
    # Some standalone non-IDN clinics
    for i in range(8):
        hco_counter += 1
        facility_id = f"HCO{1000 + len(hcos):05d}"
        state, city, region = random.choice(STATES)
        hcos.append(HCO(
            source_hco_id=facility_id,
            hco_name=f"{random.choice(['Riverside', 'Cedar', 'Lakeview', 'Highland', 'Summit'])} Neurology Clinic",
            hco_alias=f"{random.choice(['Riv', 'CedNeuro', 'LV', 'High', 'Summit'])}Clinic",
            hco_type="Specialty Clinic",
            parent_hco_id=None,
            parent_idn_name=None,
            facility_type="Specialty Clinic",
            stroke_center_level=None,
            bed_count=0,
            address=f"{random.randint(100, 9999)} {random.choice(STREET_NAMES)}",
            city=city,
            state=state,
            region=region,
            network_status="Active",
            account_priority_flag="Standard",
            source_last_updated=fmt_date(today - timedelta(days=random.randint(20, 360))),
        ))
    return hcos

# ---------------------------------------------------------------------------
# Build HCPs
# ---------------------------------------------------------------------------

HERO_DEFS = [
    {
        "first": "Arun", "last": "Patel", "middle": "K",
        "credentials": "MD, PhD",
        "primary_specialty": "Vascular Neurology",
        "secondary_specialty": "Neurology",
        "archetype": "Scientific KOL",
        "home_alias": "GLHN UMC",
        "city": "Cleveland", "state": "OH",
        "license_state": "OH",
        "name_variants": ["Arun K. Patel", "A. K. Patel", "Dr. Arun Patel", "Arun Patel MD PhD"],
        "title": "Director, Cerebrovascular Research",
        "department": "Neurology",
    },
    {
        "first": "Sarah", "last": "Lin", "middle": "J",
        "credentials": "MD, FAHA",
        "primary_specialty": "Vascular Neurology",
        "secondary_specialty": "Neurology",
        "archetype": "Regional Stroke Pathway Influencer",
        "home_alias": "GLHN Lakeside",
        "city": "Cleveland", "state": "OH",
        "license_state": "OH",
        "name_variants": ["Sarah J Lin", "S. Lin", "Dr Sarah Lin", "Sarah Lin MD"],
        "title": "Stroke Program Director",
        "department": "Stroke Center",
    },
    {
        "first": "Maria", "last": "Gomez", "middle": "E",
        "credentials": "MD",
        "primary_specialty": "Internal Medicine",
        "secondary_specialty": "Neurology",
        "archetype": "Clinical Referral Hub",
        "home_alias": "Mercy Acute GLHN",
        "city": "Akron", "state": "OH",
        "license_state": "OH",
        "name_variants": ["Maria E Gomez", "M. Gomez", "Maria Gomez MD"],
        "title": "Medical Director, Community Stroke Care",
        "department": "Internal Medicine",
    },
    {
        "first": "Kevin", "last": "Shaw", "middle": "T",
        "credentials": "MD, MPH",
        "primary_specialty": "Neurology",
        "secondary_specialty": "Vascular Neurology",
        "archetype": "Emerging Digital-Responsive Expert",
        "home_alias": "GLHN Riverside",
        "city": "Detroit", "state": "MI",
        "license_state": "MI",
        "name_variants": ["Kevin T. Shaw", "K. Shaw", "Dr Kevin Shaw"],
        "title": "Attending Neurologist, Stroke Service",
        "department": "Neurology",
    },
]


def build_hcps(hcos: list[HCO], target_unique: int = 820) -> list[HCP]:
    hcps: list[HCP] = []
    today = date(2026, 5, 1)
    npis = npi_pool(target_unique + 60, missing_rate=0.0)
    # Carve out NPIs for heroes
    hero_npis = [str(1_700_000_001 + i) for i in range(4)]
    for h in hero_npis:
        if h in npis:
            npis.remove(h)

    # Heroes first
    for i, hero in enumerate(HERO_DEFS):
        home_hco = next((h for h in hcos if h.hco_alias == hero["home_alias"]), hcos[1])
        hcp = HCP(
            source_hcp_id=f"HCP{300000 + i:06d}",
            npi=hero_npis[i],
            first_name=hero["first"],
            middle_name=hero["middle"],
            last_name=hero["last"],
            full_name=f"{hero['first']} {hero['middle']}. {hero['last']}",
            credentials=hero["credentials"],
            primary_specialty=hero["primary_specialty"],
            secondary_specialty=hero["secondary_specialty"],
            address_line_1=f"{random.randint(100,9999)} {random.choice(STREET_NAMES)}",
            city=hero["city"],
            state=hero["state"],
            zip=make_zip(),
            phone=make_phone(),
            email=make_email(hero["first"], hero["last"], home_hco.hco_alias),
            license_state=hero["license_state"],
            active_status="Active",
            source_last_updated=fmt_date(today - timedelta(days=random.randint(5, 90))),
            archetype_hint=hero["archetype"],
            is_hero=True,
            home_hco_id=home_hco.source_hco_id,
        )
        hcps.append(hcp)

    # Build the rest
    for i in range(target_unique - 4):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        middle = random.choice(MIDDLE_INITIALS)
        # bias toward stroke-relevant specialties (~35%)
        if random.random() < 0.35:
            primary = random.choice(["Vascular Neurology", "Neurology", "Interventional Neurology", "Neurosurgery"])
        else:
            primary = random.choice(SPECIALTIES)
        secondary = random.choice(SPECIALTIES + [None, None])
        # pick an anchor HCO
        anchor = random.choice([h for h in hcos if h.hco_type not in ("IDN",)])
        npi = npis[i] if i < len(npis) else None
        hcp = HCP(
            source_hcp_id=f"HCP{400000 + i:06d}",
            npi=npi,
            first_name=first,
            middle_name=middle,
            last_name=last,
            full_name=f"{first} {middle}. {last}",
            credentials=random.choice(CREDENTIALS),
            primary_specialty=primary,
            secondary_specialty=secondary,
            address_line_1=f"{random.randint(100,9999)} {random.choice(STREET_NAMES)}",
            city=anchor.city,
            state=anchor.state,
            zip=make_zip(),
            phone=make_phone(),
            email=make_email(first, last, anchor.hco_alias),
            license_state=anchor.state,
            active_status=random.choices(["Active", "Inactive"], weights=[97, 3])[0],
            source_last_updated=fmt_date(today - timedelta(days=random.randint(5, 360))),
            home_hco_id=anchor.source_hco_id,
        )
        hcps.append(hcp)
    return hcps

# ---------------------------------------------------------------------------
# Build IQVIA HCP Master rows (with duplicates / missing NPI / name variants)
# ---------------------------------------------------------------------------

def build_hcp_master_rows(hcps: list[HCP]) -> list[dict]:
    rows: list[dict] = []
    today = date(2026, 5, 1)
    for hcp in hcps:
        # primary row
        rows.append({
            "source_hcp_id": hcp.source_hcp_id,
            "npi": hcp.npi,
            "first_name": hcp.first_name,
            "middle_name": hcp.middle_name,
            "last_name": hcp.last_name,
            "full_name": hcp.full_name,
            "credentials": hcp.credentials,
            "primary_specialty": hcp.primary_specialty,
            "secondary_specialty": hcp.secondary_specialty,
            "address_line_1": hcp.address_line_1,
            "city": hcp.city,
            "state": hcp.state,
            "zip": hcp.zip,
            "phone": hcp.phone,
            "email": hcp.email,
            "license_state": hcp.license_state,
            "active_status": hcp.active_status,
            "source_last_updated": hcp.source_last_updated,
        })
    # Inject duplicates and name variants for heroes
    for hero_def, hero in zip(HERO_DEFS, hcps[:4]):
        for variant in hero_def["name_variants"]:
            parts = variant.replace("Dr.", "").replace("Dr", "").strip().split()
            first = parts[0]
            last = parts[-1].replace(",", "")
            middle = parts[1] if len(parts) > 2 else ""
            rows.append({
                "source_hcp_id": hero.source_hcp_id + "-D",
                "npi": hero.npi,
                "first_name": first,
                "middle_name": middle.replace(".", ""),
                "last_name": last,
                "full_name": variant,
                "credentials": hero.credentials,
                "primary_specialty": "Neurology" if random.random() < 0.5 else hero.primary_specialty,
                "secondary_specialty": hero.secondary_specialty,
                "address_line_1": hero.address_line_1 if random.random() < 0.6 else f"{random.randint(100,9999)} Old Practice Rd",
                "city": hero.city,
                "state": hero.state,
                "zip": hero.zip,
                "phone": hero.phone,
                "email": hero.email,
                "license_state": hero.license_state,
                "active_status": "Active",
                "source_last_updated": fmt_date(today - timedelta(days=random.randint(120, 540))),
            })
    # General duplicate injection (~5%)
    sample_dup = random.sample(hcps[4:], k=min(60, len(hcps) - 4))
    for hcp in sample_dup:
        rows.append({
            "source_hcp_id": hcp.source_hcp_id + "-D",
            "npi": hcp.npi,
            "first_name": hcp.first_name[0] + ".",  # shortened first name variant
            "middle_name": "",
            "last_name": hcp.last_name,
            "full_name": f"{hcp.first_name[0]}. {hcp.last_name}",
            "credentials": hcp.credentials,
            "primary_specialty": hcp.primary_specialty if random.random() < 0.7 else "Neurology",
            "secondary_specialty": None,
            "address_line_1": hcp.address_line_1,
            "city": hcp.city,
            "state": hcp.state,
            "zip": hcp.zip,
            "phone": hcp.phone,
            "email": hcp.email,
            "license_state": hcp.license_state,
            "active_status": "Active",
            "source_last_updated": fmt_date(today - timedelta(days=random.randint(200, 720))),
        })
    # Strip NPIs from 3% of rows
    for r in rows:
        if random.random() < 0.03 and not r["source_hcp_id"].startswith("HCP30"):
            r["npi"] = None
    random.shuffle(rows)
    return rows

# ---------------------------------------------------------------------------
# HCO master rows -> serialize
# ---------------------------------------------------------------------------

def hco_rows(hcos: list[HCO]) -> list[dict]:
    return [hco.__dict__ for hco in hcos]

# ---------------------------------------------------------------------------
# Affiliations (HCP <-> HCO)
# ---------------------------------------------------------------------------

def build_affiliations(hcps: list[HCP], hcos: list[HCO]) -> list[dict]:
    rows = []
    today = date(2026, 5, 1)
    titles_pool = [
        "Attending Physician", "Stroke Program Director", "Stroke Director",
        "Director Stroke Ctr", "Medical Director", "Chief of Neurology",
        "Vice Chair, Neurology", "Section Chief, Vascular Neurology",
        "Attending Neurologist", "Director, Cerebrovascular Research",
        "Co-Director, Stroke Center", "Hospitalist", "Director, Community Stroke Outreach",
    ]
    affiliation_types = ["Primary Practice", "Academic Appointment", "Consulting Privileges", "Affiliated Faculty"]
    affiliation_sources = ["Definitive Healthcare", "IQVIA OneKey", "CRM", "Self-reported", "Claims-derived"]
    facility_hcos = [h for h in hcos if h.hco_type not in ("IDN",)]

    for hcp in hcps:
        # Primary
        if hcp.is_hero:
            primary_hco = next((h for h in hcos if h.source_hco_id == hcp.home_hco_id), facility_hcos[0])
            hero_def = next(d for d in HERO_DEFS if d["first"] == hcp.first_name and d["last"] == hcp.last_name)
            rows.append({
                "source_hcp_id": hcp.source_hcp_id,
                "npi": hcp.npi,
                "source_hco_id": primary_hco.source_hco_id,
                "hco_name": primary_hco.hco_name,
                "affiliation_type": "Primary Practice",
                "primary_affiliation_flag": "Y",
                "department": hero_def["department"],
                "title": hero_def["title"],
                "start_date": fmt_date(today - timedelta(days=random.randint(900, 3500))),
                "end_date": None,
                "affiliation_source": "Definitive Healthcare",
                "affiliation_confidence": round(random.uniform(0.92, 0.99), 2),
            })
        else:
            primary_hco = next((h for h in facility_hcos if h.source_hco_id == hcp.home_hco_id), facility_hcos[0])
            rows.append({
                "source_hcp_id": hcp.source_hcp_id,
                "npi": hcp.npi,
                "source_hco_id": primary_hco.source_hco_id,
                "hco_name": primary_hco.hco_name,
                "affiliation_type": "Primary Practice",
                "primary_affiliation_flag": "Y",
                "department": random.choice([hcp.primary_specialty, None, None, "Neurology", "Internal Medicine"]) if random.random() > 0.1 else None,
                "title": random.choice(titles_pool + [None, None]) if random.random() > 0.12 else None,
                "start_date": fmt_date(today - timedelta(days=random.randint(180, 3600))),
                "end_date": None,
                "affiliation_source": random.choice(affiliation_sources),
                "affiliation_confidence": round(random.uniform(0.55, 0.95), 2),
            })

        # 0-3 secondary affiliations
        n_other = random.choices([0, 1, 2, 3], weights=[20, 50, 22, 8])[0]
        if hcp.is_hero:
            n_other = max(n_other, 2)
        used = {rows[-1]["source_hco_id"]}
        for _ in range(n_other):
            other = random.choice(facility_hcos)
            if other.source_hco_id in used:
                continue
            used.add(other.source_hco_id)
            end_date = None
            # 25% stale (ended affiliation)
            if random.random() < 0.25:
                end_date = fmt_date(today - timedelta(days=random.randint(60, 1500)))
            rows.append({
                "source_hcp_id": hcp.source_hcp_id,
                "npi": hcp.npi,
                "source_hco_id": other.source_hco_id,
                "hco_name": other.hco_name,
                "affiliation_type": random.choice(affiliation_types),
                # 8% conflicting primary flag
                "primary_affiliation_flag": "Y" if random.random() < 0.08 else "N",
                "department": random.choice([hcp.primary_specialty, None, "Neurology"]) if random.random() > 0.2 else None,
                "title": random.choice(titles_pool) if random.random() > 0.25 else None,
                "start_date": fmt_date(today - timedelta(days=random.randint(180, 3600))),
                "end_date": end_date,
                "affiliation_source": random.choice(affiliation_sources),
                "affiliation_confidence": round(random.uniform(0.45, 0.9), 2),
            })
    return rows

# ---------------------------------------------------------------------------
# Claims aggregate activity
# ---------------------------------------------------------------------------

def build_claims(hcps: list[HCP], hcos: list[HCO]) -> list[dict]:
    rows = []
    today = date(2026, 5, 1)
    facility_hcos = [h for h in hcos if h.hco_type not in ("IDN",)]
    for hcp in hcps:
        # not every HCP shows up in claims
        if not hcp.is_hero and random.random() < 0.25:
            continue
        period_end = today - timedelta(days=random.randint(45, 180))
        period_start = period_end - timedelta(days=365)

        stroke_specialist = hcp.primary_specialty in ("Vascular Neurology", "Neurology", "Interventional Neurology", "Neurosurgery")
        base = 0
        if stroke_specialist:
            base = random.randint(30, 280)
        else:
            base = random.randint(5, 60)
        if hcp.is_hero:
            if hcp.first_name == "Sarah":  # pathway influencer
                base = random.randint(310, 420)
            elif hcp.first_name == "Maria":  # referral hub
                base = random.randint(260, 360)
            elif hcp.first_name == "Arun":  # KOL
                base = random.randint(160, 240)
            elif hcp.first_name == "Kevin":  # emerging
                base = random.randint(110, 180)

        ischemic = base
        tia = int(base * random.uniform(0.25, 0.55))
        followup = int(base * random.uniform(0.4, 0.85))
        if hcp.is_hero and hcp.first_name == "Sarah":
            followup = int(base * 0.95)
        rx_proxy = int(base * random.uniform(0.5, 0.9))

        referral_in = int(base * random.uniform(0.1, 0.45))
        referral_out = int(base * random.uniform(0.1, 0.45))
        if hcp.is_hero and hcp.first_name == "Maria":
            referral_in = int(base * 0.9)
            referral_out = int(base * 0.7)
        shared_patient = random.randint(3, 28)
        if hcp.is_hero:
            shared_patient = random.randint(20, 60)

        readmission = round(random.uniform(0.04, 0.14), 3)
        commercial = random.randint(20, 55)
        medicare = random.randint(35, 70)

        billing_treating = random.choices(["Treating", "Billing", "Mixed"], weights=[75, 12, 13])[0]
        data_lag = random.randint(45, 180)

        hco_attr = hcp.home_hco_id
        # 10% missing HCO attribution
        if random.random() < 0.10:
            hco_attr = None

        # low counts suppressed (some non-specialists)
        if not stroke_specialist and ischemic < 15:
            ischemic = None
            tia = None

        rows.append({
            "hcp_npi": hcp.npi,
            "source_hco_id": hco_attr,
            "period_start": fmt_date(period_start),
            "period_end": fmt_date(period_end),
            "ischemic_stroke_patient_count": ischemic,
            "tia_patient_count": tia,
            "secondary_prevention_followup_count": followup,
            "antithrombotic_rx_proxy_count": rx_proxy,
            "referral_in_count": referral_in,
            "referral_out_count": referral_out,
            "shared_patient_hcp_count": shared_patient,
            "readmission_or_recurrent_event_proxy": readmission,
            "payer_mix_commercial_pct": commercial,
            "payer_mix_medicare_pct": medicare,
            "billing_vs_treating_role": billing_treating,
            "data_lag_days": data_lag,
        })
    return rows

# ---------------------------------------------------------------------------
# Publications / trials
# ---------------------------------------------------------------------------

def build_publications(hcps: list[HCP], hcos: list[HCO]) -> list[dict]:
    rows = []
    pub_id = 800000
    today_year = 2026
    # primary author cohort
    candidates = [h for h in hcps if h.primary_specialty in ("Vascular Neurology", "Neurology", "Interventional Neurology", "Neurosurgery")]
    # ensure hero coverage
    heroes = [h for h in hcps if h.is_hero]
    pub_targets = {}
    for hcp in candidates:
        pub_targets[hcp.source_hcp_id] = random.randint(0, 6)
    pub_targets[heroes[0].source_hcp_id] = 32   # Arun Patel KOL
    pub_targets[heroes[1].source_hcp_id] = 14   # Sarah Lin pathway influencer
    pub_targets[heroes[2].source_hcp_id] = 5    # Maria Gomez
    pub_targets[heroes[3].source_hcp_id] = 9    # Kevin Shaw - many recent

    def author_text(hcp: HCP) -> str:
        # 30% messy author name
        if random.random() < 0.3:
            return f"{hcp.first_name[0]}. {hcp.last_name}"
        return f"{hcp.first_name} {hcp.middle_name}. {hcp.last_name}".replace(" .", ".")

    def affil_text(hcp: HCP) -> str:
        home = next((h for h in hcos if h.source_hco_id == hcp.home_hco_id), None)
        if home is None:
            return f"{hcp.city}, {hcp.state}"
        # messy variants
        choice = random.choice([home.hco_name, home.hco_alias, f"Dept of Neurology, {home.hco_name}", f"{home.hco_name.split()[0]} {home.hco_name.split()[-1]}"])
        return choice

    for hcp_id, n in pub_targets.items():
        if n == 0:
            continue
        hcp = next(h for h in hcps if h.source_hcp_id == hcp_id)
        for k in range(n):
            pub_id += 1
            if hcp.is_hero and hcp.first_name == "Kevin":
                year = random.choice([2023, 2024, 2024, 2025, 2025, 2025])
            elif hcp.is_hero and hcp.first_name == "Arun":
                year = random.choice(list(range(2014, 2026)))
            else:
                year = random.choice(list(range(2017, 2026)))
            # co-authors
            co_authors = []
            for _ in range(random.randint(2, 5)):
                ca = random.choice(candidates)
                co_authors.append(f"{ca.first_name[0]}. {ca.last_name}")
            # ensure Arun Patel often appears as co-author for emerging Kevin
            if hcp.is_hero and hcp.first_name == "Kevin" and random.random() < 0.6:
                co_authors.append("A. Patel")
            if hcp.is_hero and hcp.first_name == "Arun" and random.random() < 0.4:
                co_authors.append("K. Shaw")
            topic_tags_choice = random.sample(TOPICS, k=random.randint(1, 3))
            if hcp.is_hero and hcp.first_name in ("Arun", "Kevin"):
                topic_tags_choice = list(set(topic_tags_choice + ["ischemic stroke", "secondary prevention"]))
            citation_count = random.randint(2, 80)
            if hcp.is_hero and hcp.first_name == "Arun":
                citation_count = random.randint(70, 320)

            trial_id = None
            trial_role = None
            if random.random() < 0.18:
                trial_id = f"NCT{random.randint(2_000_000, 9_000_000):07d}"
                trial_role = random.choice(TRIAL_ROLES)
            if hcp.is_hero and hcp.first_name == "Arun" and random.random() < 0.6:
                trial_id = f"NCT{random.randint(2_000_000, 9_000_000):07d}"
                trial_role = random.choice(["PI", "Steering Committee"])
            if hcp.is_hero and hcp.first_name == "Kevin" and k < 3:
                trial_id = f"NCT{random.randint(2_000_000, 9_000_000):07d}"
                trial_role = random.choice(["Site Investigator", "Sub-Investigator"])

            # 35% rows missing matched_npi
            matched_npi = hcp.npi if random.random() > 0.35 else None
            rows.append({
                "publication_id": pub_id,
                "author_name": author_text(hcp),
                "author_affiliation_text": affil_text(hcp),
                "matched_npi": matched_npi,
                "title": f"{random.choice(['Outcomes of', 'Trends in', 'Evidence for', 'Adoption of', 'Network analysis of'])} {random.choice(TOPICS)} in {year}",
                "journal": random.choice(JOURNALS),
                "publication_year": year,
                "topic_tags": ";".join(topic_tags_choice) if random.random() > 0.08 else None,
                "citation_count": citation_count,
                "coauthor_names": ";".join(co_authors),
                "trial_id": trial_id,
                "trial_role": trial_role,
                "conference_activity_flag": "Y" if random.random() < (0.6 if hcp.is_hero else 0.2) else "N",
                "source_confidence": round(random.uniform(0.55, 0.97), 2),
            })

    random.shuffle(rows)
    return rows

# ---------------------------------------------------------------------------
# CRM / digital engagement
# ---------------------------------------------------------------------------

def build_crm(hcps: list[HCP], hcos: list[HCO]) -> list[dict]:
    rows = []
    today = date(2026, 5, 1)
    # Account level mapping
    account_map = {}
    for hco in hcos:
        if hco.hco_type == "IDN":
            account_map[hco.source_hco_id] = (f"ACCT{1000 + len(account_map):04d}", hco.hco_name)
    # Assign HCPs to account by parent IDN
    for hcp in hcps:
        home = next((h for h in hcos if h.source_hco_id == hcp.home_hco_id), None)
        parent_id = home.parent_hco_id if home else None
        acct = account_map.get(parent_id, ("ACCT9999", "Unassigned Account"))
        # Not every HCP is in CRM
        if not hcp.is_hero and random.random() < 0.35:
            continue

        # last interaction
        if hcp.is_hero and hcp.first_name == "Arun":
            last_msl = today - timedelta(days=random.randint(8, 35))
            msl_count = random.randint(7, 12)
            rep_count = random.randint(1, 4)
            adv = "Y"
            speaker = "Y"
            email_open = random.uniform(0.45, 0.7)
            webinar = random.randint(4, 9)
            sentiment = "Engaged"
            access = "N"
        elif hcp.is_hero and hcp.first_name == "Sarah":
            last_msl = today - timedelta(days=random.randint(60, 140))
            msl_count = random.randint(2, 4)
            rep_count = random.randint(0, 2)
            adv = "N"
            speaker = "N"
            email_open = random.uniform(0.25, 0.4)
            webinar = random.randint(1, 3)
            sentiment = "Receptive"
            access = "Restricted"
        elif hcp.is_hero and hcp.first_name == "Maria":
            last_msl = today - timedelta(days=random.randint(180, 400))
            msl_count = random.randint(0, 1)
            rep_count = random.randint(0, 1)
            adv = "N"
            speaker = "N"
            email_open = random.uniform(0.1, 0.3)
            webinar = random.randint(0, 1)
            sentiment = "Unknown"
            access = "N"
        elif hcp.is_hero and hcp.first_name == "Kevin":
            last_msl = today - timedelta(days=random.randint(20, 75))
            msl_count = random.randint(2, 5)
            rep_count = random.randint(2, 5)
            adv = "N"
            speaker = "N"
            email_open = random.uniform(0.55, 0.78)
            webinar = random.randint(5, 10)
            sentiment = "Highly engaged"
            access = "N"
        else:
            last_msl = today - timedelta(days=random.randint(15, 720))
            msl_count = random.choices([0, 1, 2, 3, 5], weights=[35, 30, 18, 10, 7])[0]
            rep_count = random.randint(0, 6)
            adv = "Y" if random.random() < 0.06 else "N"
            speaker = "Y" if random.random() < 0.07 else "N"
            email_open = random.uniform(0.05, 0.6)
            webinar = random.randint(0, 5)
            sentiment = random.choices(["Engaged", "Receptive", "Neutral", "Unknown"], weights=[20, 30, 35, 15])[0]
            access = random.choices(["N", "Restricted", "No See"], weights=[78, 15, 7])[0]

        # account-level engagement (no HCP) - duplicate row at HCP-less
        topics_engaged = random.sample(CONTENT_TOPICS, k=random.randint(1, 3))
        # Missing NPI 10% (CRM data hygiene issue)
        npi = hcp.npi if random.random() > 0.1 else None
        rows.append({
            "crm_hcp_id": f"CRM{50000 + len(rows):06d}",
            "npi": npi,
            "crm_account_id": acct[0],
            "crm_account_name": acct[1],
            "owner_team": random.choice(OWNER_TEAMS),
            "last_msl_interaction_date": fmt_date(last_msl),
            "msl_interaction_count_12m": msl_count,
            "rep_interaction_count_12m": rep_count,
            "advisory_board_flag": adv,
            "speaker_program_flag": speaker,
            "email_open_rate": round(email_open, 2),
            "webinar_attendance_count": webinar,
            "content_topics_engaged": ";".join(topics_engaged),
            "engagement_sentiment": sentiment,
            "access_restriction_flag": access,
        })

    # 20 duplicate CRM rows
    for hcp in random.sample(hcps[4:], k=20):
        rows.append({
            "crm_hcp_id": f"CRM{50000 + len(rows):06d}",
            "npi": hcp.npi,
            "crm_account_id": "ACCTDUP",
            "crm_account_name": "Legacy Account",
            "owner_team": random.choice(OWNER_TEAMS),
            "last_msl_interaction_date": fmt_date(today - timedelta(days=random.randint(380, 900))),
            "msl_interaction_count_12m": 0,
            "rep_interaction_count_12m": 0,
            "advisory_board_flag": "N",
            "speaker_program_flag": "N",
            "email_open_rate": 0.0,
            "webinar_attendance_count": 0,
            "content_topics_engaged": "",
            "engagement_sentiment": "Unknown",
            "access_restriction_flag": "N",
        })
    random.shuffle(rows)
    return rows

# ---------------------------------------------------------------------------
# Canonical model derivation (for the static demo app)
# ---------------------------------------------------------------------------

def clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def derive_canonical(hcps: list[HCP], hcos: list[HCO], affiliations, claims, pubs, crm) -> dict[str, Any]:
    aff_by_hcp: dict[str, list[dict]] = {}
    for r in affiliations:
        aff_by_hcp.setdefault(r["source_hcp_id"], []).append(r)

    claims_by_npi: dict[str, dict] = {}
    for r in claims:
        if r.get("hcp_npi"):
            claims_by_npi[r["hcp_npi"]] = r

    pubs_by_npi: dict[str, list[dict]] = {}
    pubs_by_lastname: dict[str, list[dict]] = {}
    for r in pubs:
        if r.get("matched_npi"):
            pubs_by_npi.setdefault(r["matched_npi"], []).append(r)
        else:
            last = r["author_name"].split()[-1].lower()
            pubs_by_lastname.setdefault(last, []).append(r)

    crm_by_npi: dict[str, dict] = {}
    for r in crm:
        if r.get("npi"):
            crm_by_npi[r["npi"]] = r

    hco_by_id = {h.source_hco_id: h for h in hcos}
    parent_idn_by_hco = {}
    for h in hcos:
        if h.hco_type == "IDN":
            continue
        parent_id = h.parent_hco_id
        parent_idn_name = hco_by_id[parent_id].hco_name if parent_id in hco_by_id else h.parent_idn_name
        parent_idn_by_hco[h.source_hco_id] = (parent_id, parent_idn_name)

    canonical_hcps = []
    for hcp in hcps:
        affs = aff_by_hcp.get(hcp.source_hcp_id, [])
        # determine primary HCO
        primary_aff = next((a for a in affs if a["primary_affiliation_flag"] == "Y"), affs[0] if affs else None)
        primary_hco_id = primary_aff["source_hco_id"] if primary_aff else hcp.home_hco_id
        primary_hco = hco_by_id.get(primary_hco_id)
        parent_info = parent_idn_by_hco.get(primary_hco_id, (None, None))

        # claims
        cl = claims_by_npi.get(hcp.npi, {})
        stroke = cl.get("ischemic_stroke_patient_count") or 0
        tia = cl.get("tia_patient_count") or 0
        followup = cl.get("secondary_prevention_followup_count") or 0
        referrals_in = cl.get("referral_in_count") or 0
        referrals_out = cl.get("referral_out_count") or 0
        shared = cl.get("shared_patient_hcp_count") or 0

        # pubs (by NPI primarily; fallback by last name only for unmatched)
        my_pubs = pubs_by_npi.get(hcp.npi, [])
        # Approximate the value of fuzzy-matched publications (assume the app would resolve them)
        if hcp.is_hero:
            my_pubs = my_pubs + [p for p in pubs_by_lastname.get(hcp.last_name.lower(), []) if hcp.first_name[0] in p["author_name"].split()[0]]
        stroke_pubs = sum(1 for p in my_pubs if (p.get("topic_tags") or "").find("stroke") >= 0 or (p.get("topic_tags") or "").find("TIA") >= 0)
        recent_pubs = sum(1 for p in my_pubs if p.get("publication_year", 2000) >= 2023)
        citations = sum(p.get("citation_count", 0) for p in my_pubs)
        co_set = set()
        for p in my_pubs:
            for ca in (p.get("coauthor_names") or "").split(";"):
                if ca.strip():
                    co_set.add(ca.strip().lower())
        coauthor_degree = len(co_set)
        trial_count = sum(1 for p in my_pubs if p.get("trial_id"))
        trial_role_strength = "High" if any(p.get("trial_role") in ("PI", "Steering Committee") for p in my_pubs) else ("Medium" if any(p.get("trial_role") for p in my_pubs) else "None")

        # CRM
        cm = crm_by_npi.get(hcp.npi, {})
        msl_count = cm.get("msl_interaction_count_12m", 0)
        rep_count = cm.get("rep_interaction_count_12m", 0)
        last_eng = cm.get("last_msl_interaction_date")
        digital_eng = (cm.get("email_open_rate") or 0) * 60 + (cm.get("webinar_attendance_count", 0) or 0) * 6

        # Scoring
        disease_relevance = clamp(
            (stroke + tia) * 0.15 + followup * 0.1 + stroke_pubs * 3.0 + (40 if hcp.primary_specialty in ("Vascular Neurology", "Interventional Neurology") else 0)
        )
        scientific_influence = clamp(
            len(my_pubs) * 2.5 + recent_pubs * 1.5 + citations * 0.08 + (15 if trial_role_strength == "High" else (7 if trial_role_strength == "Medium" else 0)) + coauthor_degree * 0.5
        )
        clinical_network = clamp(
            referrals_in * 0.25 + referrals_out * 0.18 + shared * 1.6 + (stroke + tia) * 0.08
        )
        system_influence = 0
        title_text = (primary_aff or {}).get("title") or ""
        if any(k in (title_text or "") for k in ("Director", "Chief", "Vice Chair", "Section Chief")):
            system_influence += 35
        if primary_hco and primary_hco.stroke_center_level == "Comprehensive":
            system_influence += 25
        elif primary_hco and primary_hco.stroke_center_level == "Primary":
            system_influence += 15
        if primary_hco and primary_hco.account_priority_flag == "Tier 1":
            system_influence += 15
        if primary_hco and primary_hco.facility_type == "Academic Medical Center":
            system_influence += 10
        system_influence = clamp(system_influence + followup * 0.04)

        institutional_influence = clamp((system_influence + scientific_influence) / 2)
        bayer_relationship = clamp(msl_count * 6 + rep_count * 3 + (cm.get("webinar_attendance_count", 0) or 0) * 2 + (15 if cm.get("advisory_board_flag") == "Y" else 0) + (15 if cm.get("speaker_program_flag") == "Y" else 0))
        digital_responsiveness = clamp(digital_eng)
        launch_relevance = clamp(disease_relevance * 0.35 + scientific_influence * 0.25 + clinical_network * 0.2 + system_influence * 0.2)
        data_recency = 100
        if cm.get("last_msl_interaction_date"):
            days = (date(2026, 5, 1) - datetime.strptime(cm["last_msl_interaction_date"], "%Y-%m-%d").date()).days
            data_recency = clamp(100 - days / 6)
        data_confidence = clamp(60 + (40 if hcp.npi else -15) - (5 if any(a.get("primary_affiliation_flag") == "Y" for a in affs[1:]) else 0))

        # Archetype classification — generous bands so the 2x2 maps actually populate
        archetype = "Monitor"
        secondary_arch = None
        reason_codes: list[str] = []
        if scientific_influence >= 55 and trial_role_strength in ("High", "Medium"):
            archetype = "Scientific KOL"
            reason_codes.append(f"{len(my_pubs)} pubs / {citations} citations")
            if trial_role_strength == "High":
                reason_codes.append("PI or Steering Committee on stroke trial")
        elif scientific_influence >= 60 and trial_role_strength == "None":
            archetype = "Evidence Leader"
            reason_codes.append(f"{len(my_pubs)} pubs / {citations} citations, limited trial leadership")
        if archetype == "Monitor" and system_influence >= 45 and (followup >= 60 or stroke >= 60) and ("Director" in (title_text or "") or "Chief" in (title_text or "")):
            archetype = "Regional Stroke Pathway Influencer"
            reason_codes.append("Leads stroke program in priority system")
            reason_codes.append(f"{followup} post-stroke follow-ups")
        elif archetype == "Monitor" and system_influence >= 35 and (followup >= 40 or stroke >= 40):
            archetype = "Operational Pathway Influencer"
            reason_codes.append("Operational leader on stroke pathway adoption")
        if archetype == "Monitor" and clinical_network >= 40 and stroke + tia >= 80:
            archetype = "Clinical Referral Hub"
            reason_codes.append(f"{referrals_in + referrals_out} referrals / {shared} shared patients")
        if (referrals_in + referrals_out) > 50 and primary_hco and primary_hco.facility_type == "Community Hospital":
            secondary_arch = "Community-to-Stroke-Center Bridge"
            reason_codes.append("Community hospital with strong inflow to stroke centers")
        if launch_relevance >= 50 and bayer_relationship <= 22:
            if archetype == "Monitor":
                archetype = "Under-engaged High-Value HCP"
            else:
                secondary_arch = secondary_arch or "Under-engaged High-Value HCP"
            reason_codes.append("High launch relevance with weak Bayer relationship")
        if recent_pubs >= 3 and scientific_influence < 65 and len(my_pubs) < 14:
            if archetype == "Monitor":
                archetype = "Emerging Expert"
            else:
                secondary_arch = secondary_arch or "Emerging Expert"
            reason_codes.append(f"{recent_pubs} pubs in last 3 years / rising trajectory")
        if digital_responsiveness >= 35 and launch_relevance >= 40:
            if archetype == "Monitor":
                archetype = "Digital-Responsive Influencer"
            else:
                secondary_arch = secondary_arch or "Digital-Responsive Influencer"
            reason_codes.append("Strong digital engagement on stroke topics")

        # Hero overrides ensure stable demo
        if hcp.is_hero:
            archetype = hcp.archetype_hint or archetype
            if hcp.first_name == "Maria":
                archetype = "Clinical Referral Hub"
                secondary_arch = "Community-to-Stroke-Center Bridge"
                reason_codes = [
                    "High shared-patient network across community + stroke centers",
                    f"{referrals_in + referrals_out} referrals / {shared} shared patients",
                    "Limited Bayer touchpoints in past 12 months",
                ]
            elif hcp.first_name == "Arun":
                secondary_arch = "Evidence Leader"
                reason_codes = [
                    f"{len(my_pubs)} stroke publications, {citations} citations",
                    "PI or steering committee on multiple stroke trials",
                    "Frequent MSL and advisory board engagement",
                ]
            elif hcp.first_name == "Sarah":
                secondary_arch = "Under-engaged High-Value HCP"
                reason_codes = [
                    "Stroke Program Director at flagship IDN Comprehensive Stroke Center",
                    f"{followup} post-stroke follow-ups in 12 months",
                    "Moderate scientific output, central in IDN pathway",
                ]
            elif hcp.first_name == "Kevin":
                archetype = "Emerging Expert"
                secondary_arch = "Digital-Responsive Influencer"
                reason_codes = [
                    f"{recent_pubs} pubs in last 3 years, co-authored with Dr. Patel",
                    "High email open and webinar engagement on stroke prevention",
                    "Not yet on advisory boards or speaker bureau",
                ]

        recommended_team = (
            "MSL Stroke" if archetype in ("Scientific KOL", "Emerging Expert", "Digital-Responsive Influencer") else
            "KAM Health Systems" if archetype == "Regional Stroke Pathway Influencer" else
            "Field Sales" if archetype == "Clinical Referral Hub" else
            "Medical Affairs"
        )
        recommended_action = (
            "Advisory board invitation + co-authored evidence brief" if archetype == "Scientific KOL" else
            "MSL evidence discussion followed by pathway workshop" if archetype == "Regional Stroke Pathway Influencer" else
            "Account team referral mapping + community education kit" if archetype == "Clinical Referral Hub" else
            "Pair digital nurture with peer-to-peer co-author intro" if archetype == "Emerging Expert" else
            "Targeted digital education + webinar follow-up" if archetype == "Digital-Responsive Influencer" else
            "Prioritized MSL outreach within 30 days" if archetype == "Under-engaged High-Value HCP" else
            "Place in monitoring queue, revisit in 6 months"
        )
        confidence_band = "High" if data_confidence >= 75 else ("Medium" if data_confidence >= 55 else "Low")

        canonical_hcps.append({
            "canonical_hcp_id": f"C{hcp.source_hcp_id}",
            "npi": hcp.npi,
            "source_ids": [hcp.source_hcp_id, f"{hcp.source_hcp_id}-D" if hcp.is_hero else None],
            "full_name_resolved": hcp.full_name,
            "name_variants": [hcp.full_name] + ([d["name_variants"] for d in HERO_DEFS if d["first"] == hcp.first_name and d["last"] == hcp.last_name][0] if hcp.is_hero else []),
            "match_confidence": round(random.uniform(0.85, 0.99), 2) if hcp.npi else round(random.uniform(0.55, 0.78), 2),
            "source_coverage_count": sum([1, 1 if cl else 0, 1 if my_pubs else 0, 1 if cm else 0]),
            "data_recency_score": round(data_recency, 1),
            "data_quality_flag": "Conflict" if any(a.get("primary_affiliation_flag") == "Y" for a in affs[1:]) else ("Stale" if data_recency < 50 else "Clean"),
            "primary_specialty_resolved": hcp.primary_specialty,
            "secondary_specialty_resolved": hcp.secondary_specialty,
            "disease_relevance_score": round(disease_relevance, 1),
            "inferred_clinical_role": title_text or "Attending",
            "claims_disease_volume_score": round(clamp((stroke + tia + followup) / 4), 1),
            "stroke_patient_count": stroke,
            "tia_patient_count": tia,
            "followup_activity_score": round(clamp(followup / 4), 1),
            "primary_hco_id_inferred": primary_hco_id,
            "primary_hco_name_inferred": primary_hco.hco_name if primary_hco else None,
            "parent_idn_id": parent_info[0],
            "parent_idn_name": parent_info[1],
            "affiliation_count": len(affs),
            "affiliation_conflict_flag": any(a.get("primary_affiliation_flag") == "Y" for a in affs[1:]),
            "primary_affiliation_reason": "Claims + Definitive primary + CRM agreement" if cl and primary_aff else "Definitive primary only",
            "stroke_center_affiliation_flag": bool(primary_hco and primary_hco.stroke_center_level in ("Comprehensive", "Primary")),
            "institutional_role": title_text,
            "publication_count_total": len(my_pubs),
            "stroke_publication_count": stroke_pubs,
            "citation_count_total": citations,
            "recent_publication_count_3y": recent_pubs,
            "coauthor_degree": coauthor_degree,
            "top_coauthor_kol_flag": "A. Patel" in co_set or "patel" in (n.split()[-1] for n in co_set),
            "trial_count": trial_count,
            "trial_role_strength": trial_role_strength,
            "topic_affinity": ["ischemic stroke", "secondary prevention"] if disease_relevance > 50 else [],
            "referral_in_count": referrals_in,
            "referral_out_count": referrals_out,
            "shared_patient_network_degree": shared,
            "referral_centrality_score": round(clamp((referrals_in + referrals_out) / 6 + shared), 1),
            "bridge_score": round(clamp((referrals_in + referrals_out) * 0.3 + (15 if primary_hco and primary_hco.facility_type == "Community Hospital" else 0)), 1),
            "community_to_stroke_center_bridge_flag": secondary_arch == "Community-to-Stroke-Center Bridge",
            "hcp_network_cluster_id": f"CL{(hash(hcp.source_hcp_id) % 12) + 1}",
            "dominant_network_type": "Scientific" if scientific_influence > clinical_network else "Clinical",
            "crm_linked_flag": bool(cm),
            "msl_interaction_count_12m": msl_count,
            "rep_interaction_count_12m": rep_count,
            "last_engagement_date": last_eng,
            "advisory_board_flag": cm.get("advisory_board_flag", "N") == "Y",
            "speaker_program_flag": cm.get("speaker_program_flag", "N") == "Y",
            "digital_engagement_score": round(digital_responsiveness, 1),
            "bayer_relationship_strength": round(bayer_relationship, 1),
            "under_engaged_flag": launch_relevance >= 60 and bayer_relationship <= 25,
            "scientific_influence_score": round(scientific_influence, 1),
            "clinical_network_score": round(clinical_network, 1),
            "system_influence_score": round(system_influence, 1),
            "institutional_influence_score": round(institutional_influence, 1),
            "launch_relevance_score": round(launch_relevance, 1),
            "primary_launch_archetype": archetype,
            "secondary_launch_archetype": secondary_arch,
            "archetype_reason_codes": reason_codes,
            "recommended_bayer_team": recommended_team,
            "recommended_next_action": recommended_action,
            "confidence_band": confidence_band,
            "is_hero": hcp.is_hero,
            "city": hcp.city,
            "state": hcp.state,
            "region": (primary_hco.region if primary_hco else None),
        })

    # canonical HCOs
    canonical_hcos = []
    aff_by_hco: dict[str, list[str]] = {}
    for r in affiliations:
        aff_by_hco.setdefault(r["source_hco_id"], []).append(r["source_hcp_id"])
    high_influence_ids = {h["canonical_hcp_id"] for h in canonical_hcps if h["launch_relevance_score"] >= 65}
    for h in hcos:
        aff_hcps = aff_by_hco.get(h.source_hco_id, [])
        # crude: high-influence count where the hcp's primary_hco maps here
        high_count = sum(1 for c in canonical_hcps if c["primary_hco_id_inferred"] == h.source_hco_id and c["launch_relevance_score"] >= 65)
        stroke_volume = sum((c["stroke_patient_count"] or 0) + (c["tia_patient_count"] or 0) for c in canonical_hcps if c["primary_hco_id_inferred"] == h.source_hco_id)
        readiness = clamp((25 if h.stroke_center_level == "Comprehensive" else 12 if h.stroke_center_level == "Primary" else 5) + high_count * 5 + (15 if h.account_priority_flag == "Tier 1" else 0))
        canonical_hcos.append({
            "canonical_hco_id": f"C{h.source_hco_id}",
            "source_hco_id": h.source_hco_id,
            "hco_name_resolved": h.hco_name,
            "hco_aliases": [h.hco_alias],
            "hco_type": h.hco_type,
            "parent_hco_id": h.parent_hco_id,
            "parent_idn_name": h.parent_idn_name,
            "stroke_center_level": h.stroke_center_level,
            "bed_count": h.bed_count,
            "region": h.region,
            "city": h.city,
            "state": h.state,
            "facility_type": h.facility_type,
            "account_priority_flag": h.account_priority_flag,
            "affiliated_hcp_count": len(set(aff_hcps)),
            "high_influence_hcp_count": high_count,
            "stroke_volume_proxy": stroke_volume,
            "referral_inflow_score": round(clamp(stroke_volume / 8), 1),
            "launch_readiness_score": round(readiness, 1),
            "data_confidence_score": round(clamp(90 if h.stroke_center_level else 70), 1),
        })

    # network edges
    edges = []
    # HCP-HCO affiliations
    for r in affiliations:
        if r.get("end_date"):
            continue
        edges.append({
            "source_node_id": f"C{r['source_hcp_id']}",
            "source_node_type": "HCP",
            "target_node_id": f"C{r['source_hco_id']}",
            "target_node_type": "HCO",
            "edge_type": "affiliation",
            "edge_weight": float(r.get("affiliation_confidence", 0.7)),
            "edge_source": r.get("affiliation_source", "Affiliations"),
            "evidence_text": f"{r.get('title', '')} at {r.get('hco_name', '')}".strip(),
            "time_period": r.get("start_date"),
            "confidence_score": float(r.get("affiliation_confidence", 0.7)),
        })
    # HCO-IDN
    for h in hcos:
        if h.parent_hco_id:
            edges.append({
                "source_node_id": f"C{h.source_hco_id}",
                "source_node_type": "HCO",
                "target_node_id": f"C{h.parent_hco_id}",
                "target_node_type": "IDN",
                "edge_type": "hco_hierarchy",
                "edge_weight": 1.0,
                "edge_source": "Definitive Healthcare",
                "evidence_text": f"{h.hco_name} -> {h.parent_idn_name}",
                "time_period": None,
                "confidence_score": 0.95,
            })

    # HCP-HCP co-author edges (parse coauthor_names, match initials to canonical)
    npi_to_canonical = {h["npi"]: h["canonical_hcp_id"] for h in canonical_hcps if h["npi"]}
    # Build initial+lastname -> canonical lookup
    initial_lookup: dict[str, list[str]] = {}
    for hcp in hcps:
        key = f"{hcp.first_name[0].lower()}.{hcp.last_name.lower()}"
        initial_lookup.setdefault(key, []).append(f"C{hcp.source_hcp_id}")
    coauthor_pairs: dict[tuple[str, str], int] = {}
    for p in pubs:
        primary_npi = p.get("matched_npi")
        ca_primary = npi_to_canonical.get(primary_npi) if primary_npi else None
        if not ca_primary:
            # try last-name fuzzy on author_name
            an_parts = (p.get("author_name") or "").lower().replace(".", " ").split()
            if len(an_parts) >= 2:
                key = f"{an_parts[0][0]}.{an_parts[-1]}"
                candidates = initial_lookup.get(key, [])
                if len(candidates) == 1:
                    ca_primary = candidates[0]
        if not ca_primary:
            continue
        for ca_name in (p.get("coauthor_names") or "").split(";"):
            ca_name = ca_name.strip().lower().replace(".", "")
            parts = ca_name.split()
            if len(parts) < 2:
                continue
            key = f"{parts[0][0]}.{parts[-1]}"
            candidates = initial_lookup.get(key, [])
            for cand in candidates:
                if cand == ca_primary:
                    continue
                pair = tuple(sorted((ca_primary, cand)))
                coauthor_pairs[pair] = coauthor_pairs.get(pair, 0) + 1
    # Threshold: require at least 2 shared pubs to keep an edge (filters fuzzy noise)
    for (a, b), count in coauthor_pairs.items():
        if count < 2:
            continue
        edges.append({
            "source_node_id": a,
            "source_node_type": "HCP",
            "target_node_id": b,
            "target_node_type": "HCP",
            "edge_type": "co-publication",
            "edge_weight": float(min(count, 8)),
            "edge_source": "Publications",
            "evidence_text": f"{count} shared publications",
            "time_period": "last_5y",
            "confidence_score": 0.78,
        })

    # HCP-trial
    trial_seen = set()
    for p in pubs:
        if p.get("trial_id") and p.get("matched_npi") and p["matched_npi"] in npi_to_canonical:
            key = (npi_to_canonical[p["matched_npi"]], p["trial_id"])
            if key in trial_seen:
                continue
            trial_seen.add(key)
            edges.append({
                "source_node_id": key[0],
                "source_node_type": "HCP",
                "target_node_id": p["trial_id"],
                "target_node_type": "Trial",
                "edge_type": "trial_involvement",
                "edge_weight": 1.0 if p["trial_role"] in ("PI", "Steering Committee") else 0.6,
                "edge_source": "ClinicalTrials.gov-like",
                "evidence_text": f"Role: {p['trial_role']}",
                "time_period": str(p.get("publication_year")),
                "confidence_score": 0.85,
            })

    # HCP-topic: based on topic_affinity in canonical
    for h in canonical_hcps:
        for t in (h["topic_affinity"] or []):
            edges.append({
                "source_node_id": h["canonical_hcp_id"],
                "source_node_type": "HCP",
                "target_node_id": f"TOPIC::{t}",
                "target_node_type": "Topic",
                "edge_type": "topic_affinity",
                "edge_weight": h["disease_relevance_score"] / 100,
                "edge_source": "Publications + digital",
                "evidence_text": t,
                "time_period": None,
                "confidence_score": 0.7,
            })

    # HCP-HCP referral edges synthetic: connect HCPs within same parent IDN with strong shared-patient and complementary roles
    by_idn: dict[str, list[dict]] = {}
    for h in canonical_hcps:
        if h["parent_idn_id"]:
            by_idn.setdefault(h["parent_idn_id"], []).append(h)
    ref_seen = set()
    for idn_id, members in by_idn.items():
        members_sorted = sorted(members, key=lambda x: -x["referral_centrality_score"])[:25]
        for m in members_sorted:
            if m["referral_centrality_score"] < 8:
                continue
            for n in members_sorted:
                if m == n:
                    continue
                if n["referral_centrality_score"] < 6:
                    continue
                if random.random() > 0.18:
                    continue
                key = tuple(sorted((m["canonical_hcp_id"], n["canonical_hcp_id"]))) + ("ref",)
                if key in ref_seen:
                    continue
                ref_seen.add(key)
                edges.append({
                    "source_node_id": m["canonical_hcp_id"],
                    "source_node_type": "HCP",
                    "target_node_id": n["canonical_hcp_id"],
                    "target_node_type": "HCP",
                    "edge_type": "referral",
                    "edge_weight": min(10, m["referral_centrality_score"] / 10 + n["referral_centrality_score"] / 15),
                    "edge_source": "Claims",
                    "evidence_text": "Shared post-stroke follow-up patients",
                    "time_period": "12m",
                    "confidence_score": 0.7,
                })

    return {
        "canonical_hcps": canonical_hcps,
        "canonical_hcos": canonical_hcos,
        "network_edges": edges,
    }

# ---------------------------------------------------------------------------
# Excel writers
# ---------------------------------------------------------------------------

def write_excel(path: Path, df: pd.DataFrame, sheet_name: str) -> None:
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name=sheet_name)
        ws = writer.sheets[sheet_name]
        ws.freeze_panes = "A2"
        for idx, col in enumerate(df.columns, start=1):
            max_len = max(
                [len(str(col))] + [len(str(v)) for v in df[col].head(200).tolist() if v is not None]
            )
            ws.column_dimensions[get_column_letter(idx)].width = min(max_len + 2, 38)


# ---------------------------------------------------------------------------
# Quality profile helpers (precomputed for static demo)
# ---------------------------------------------------------------------------

def profile_quality(rows: list[dict], schema_type: str) -> dict:
    df = pd.DataFrame(rows)
    n = len(df)
    missing_by_col = {c: int(df[c].isna().sum() + (df[c] == "").sum()) for c in df.columns}
    out = {
        "row_count": n,
        "column_count": len(df.columns),
        "columns": list(df.columns),
        "missing_by_key": {k: v for k, v in missing_by_col.items() if v > 0},
        "issues": [],
    }
    if schema_type == "HCP master":
        dup_npi = int(df["npi"].duplicated(keep=False).fillna(False).sum())
        out["duplicate_id_count"] = dup_npi
        out["issues"] = [
            {"label": "Missing NPI", "severity": "amber", "count": int(df["npi"].isna().sum())},
            {"label": "Duplicate NPI rows", "severity": "amber", "count": dup_npi},
            {"label": "Name variants for hero HCPs", "severity": "amber", "count": 12},
            {"label": "Specialty too broad (e.g. Neurology)", "severity": "amber", "count": int((df["primary_specialty"] == "Neurology").sum())},
        ]
        out["score"] = 78
    elif schema_type == "HCO hierarchy":
        out["issues"] = [
            {"label": "Missing stroke center level", "severity": "amber", "count": int(df["stroke_center_level"].isna().sum())},
            {"label": "Parent IDN string mismatch", "severity": "amber", "count": int(df["parent_idn_name"].fillna("").str.contains("legacy").sum())},
            {"label": "Hospital aliases / acronyms", "severity": "green", "count": int(df["hco_alias"].fillna("").apply(lambda x: len(str(x)) <= 6).sum())},
        ]
        out["score"] = 84
    elif schema_type == "Affiliations":
        # multiple per HCP / conflicting primary
        prim_counts = df[df["primary_affiliation_flag"] == "Y"].groupby("source_hcp_id").size()
        conflicting = int((prim_counts > 1).sum())
        out["issues"] = [
            {"label": "Conflicting primary affiliation", "severity": "red", "count": conflicting},
            {"label": "Stale affiliation (end_date set)", "severity": "amber", "count": int(df["end_date"].notna().sum())},
            {"label": "Missing title", "severity": "amber", "count": int(df["title"].isna().sum())},
            {"label": "Missing department", "severity": "amber", "count": int(df["department"].isna().sum())},
        ]
        out["score"] = 72
    elif schema_type == "Claims":
        out["issues"] = [
            {"label": "Median claims lag (days)", "severity": "amber", "count": int(df["data_lag_days"].median())},
            {"label": "Missing HCO attribution", "severity": "amber", "count": int(df["source_hco_id"].isna().sum())},
            {"label": "Billing vs treating ambiguity", "severity": "amber", "count": int((df["billing_vs_treating_role"] != "Treating").sum())},
            {"label": "Low counts suppressed", "severity": "green", "count": int(df["ischemic_stroke_patient_count"].isna().sum())},
        ]
        out["score"] = 76
    elif schema_type == "Publications":
        out["issues"] = [
            {"label": "Author without NPI", "severity": "red", "count": int(df["matched_npi"].isna().sum())},
            {"label": "Missing topic tags", "severity": "amber", "count": int(df["topic_tags"].isna().sum())},
            {"label": "Trial role variants need normalization", "severity": "amber", "count": int(df["trial_role"].notna().sum())},
            {"label": "Messy institution strings", "severity": "amber", "count": int(df["author_affiliation_text"].fillna("").apply(lambda x: "Dept" in str(x)).sum())},
        ]
        out["score"] = 68
    elif schema_type == "CRM":
        out["issues"] = [
            {"label": "Missing NPI on CRM contact", "severity": "red", "count": int(df["npi"].isna().sum())},
            {"label": "Duplicate CRM contacts", "severity": "amber", "count": int(df["crm_account_id"].eq("ACCTDUP").sum())},
            {"label": "Stale (>180d) last interaction", "severity": "amber", "count": int(pd.to_datetime(df["last_msl_interaction_date"], errors="coerce").lt(pd.Timestamp(date(2026, 5, 1) - timedelta(days=180))).sum())},
            {"label": "Account-level (no HCP) engagement", "severity": "amber", "count": int((df["engagement_sentiment"] == "Unknown").sum())},
        ]
        out["score"] = 70
    return out

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    print("Generating synthetic HCP network intelligence data...")
    hcos = build_hcos()
    hcps = build_hcps(hcos, target_unique=820)

    iqvia_rows = build_hcp_master_rows(hcps)
    hco_master = hco_rows(hcos)
    aff_rows = build_affiliations(hcps, hcos)
    claims_rows = build_claims(hcps, hcos)
    pubs_rows = build_publications(hcps, hcos)
    crm_rows = build_crm(hcps, hcos)

    files = [
        ("IQVIA_HCP_Master.xlsx", iqvia_rows, "HCP_Master", "HCP master"),
        ("Definitive_HCO_IDN_Hierarchy.xlsx", hco_master, "HCO_Hierarchy", "HCO hierarchy"),
        ("HCP_HCO_Affiliations.xlsx", aff_rows, "Affiliations", "Affiliations"),
        ("Claims_Stroke_TIA_Activity.xlsx", claims_rows, "Claims_Activity", "Claims"),
        ("Publications_Trials_Scientific_Activity.xlsx", pubs_rows, "Pubs_Trials", "Publications"),
        ("CRM_Digital_Engagement.xlsx", crm_rows, "CRM_Digital", "CRM"),
    ]

    profiles = {}
    for name, rows, sheet, schema_type in files:
        df = pd.DataFrame(rows)
        path = OUT_DIR / name
        write_excel(path, df, sheet)
        profiles[name] = profile_quality(rows, schema_type)
        profiles[name]["file_name"] = name
        profiles[name]["sheet_name"] = sheet
        profiles[name]["schema_type"] = schema_type
        profiles[name]["sample_rows"] = rows[:6]

    # Build canonical for the static demo
    canonical = derive_canonical(hcps, hcos, aff_rows, claims_rows, pubs_rows, crm_rows)

    # Compute summary
    canonical_hcps = canonical["canonical_hcps"]
    canonical_hcos = canonical["canonical_hcos"]
    edges = canonical["network_edges"]
    archetype_counts: dict[str, int] = {}
    for h in canonical_hcps:
        archetype_counts[h["primary_launch_archetype"]] = archetype_counts.get(h["primary_launch_archetype"], 0) + 1

    summary = {
        "canonical_hcp_count": len(canonical_hcps),
        "canonical_hco_count": len(canonical_hcos),
        "affiliation_count": sum(1 for e in edges if e["edge_type"] == "affiliation"),
        "coauthor_edge_count": sum(1 for e in edges if e["edge_type"] == "co-publication"),
        "referral_edge_count": sum(1 for e in edges if e["edge_type"] == "referral"),
        "trial_link_count": sum(1 for e in edges if e["edge_type"] == "trial_involvement"),
        "topic_edge_count": sum(1 for e in edges if e["edge_type"] == "topic_affinity"),
        "hierarchy_edge_count": sum(1 for e in edges if e["edge_type"] == "hco_hierarchy"),
        "crm_linked_hcp_count": sum(1 for h in canonical_hcps if h["crm_linked_flag"]),
        "classified_hcp_count": sum(1 for h in canonical_hcps if h["primary_launch_archetype"] != "Monitor"),
        "manual_review_count": sum(1 for h in canonical_hcps if h["affiliation_conflict_flag"] or h["data_quality_flag"] == "Conflict"),
        "archetype_counts": archetype_counts,
        "regions": sorted({h.region for h in hcos}),
        "idn_options": sorted({h.hco_name for h in hcos if h.hco_type == "IDN"}),
        "specialty_options": sorted({h.primary_specialty for h in hcps}),
    }

    # File tile metadata
    file_tiles = []
    for name, rows, sheet, schema_type in files:
        prof = profiles[name]
        file_tiles.append({
            "file_name": name,
            "schema_type": schema_type,
            "sheet": sheet,
            "row_count": prof["row_count"],
            "column_count": prof["column_count"],
            "issue_count": sum(i["count"] for i in prof["issues"]),
            "score": prof["score"],
            "columns": prof["columns"][:8],
        })

    # Write demo_data.js (window.DEMO_DATA = { ... })
    DATA_JS_PATH.parent.mkdir(parents=True, exist_ok=True)
    bundle = {
        "summary": summary,
        "tiles": file_tiles,
        "profiles": profiles,
        "canonical_hcps": canonical_hcps,
        "canonical_hcos": canonical_hcos,
        "network_edges": edges,
        "hero_ids": [f"C{hcp.source_hcp_id}" for hcp in hcps if hcp.is_hero],
    }
    DATA_JS_PATH.write_text("window.DEMO_DATA = " + json.dumps(bundle, indent=2, default=str) + ";\n", encoding="utf-8")
    print(f"  Wrote {DATA_JS_PATH}")

    # README
    readme = OUT_DIR / "README_generated_data.md"
    readme.write_text(
        "# Generated synthetic data\n\n"
        "Deterministic synthetic data for the HCP Network Intelligence demo. Seed = 42.\n\n"
        "## Files\n\n"
        + "\n".join([f"- **{name}** — {prof['row_count']} rows × {prof['column_count']} cols, quality score {prof['score']}" for name, _, _, _ in files for prof in [profiles[name]]])
        + "\n\n## Known data quality issues (intentional)\n\n"
        + "- Duplicate HCP rows and shortened name variants in IQVIA master (hero HCPs get extra variants).\n"
        + "- 3% missing NPI in HCP master, 10% missing NPI in CRM, ~35% missing matched_npi in publications.\n"
        + "- 8% missing stroke center level in HCO hierarchy; 6% legacy parent IDN string mismatches.\n"
        + "- Conflicting primary affiliation flags (~8% of secondary affiliations marked primary).\n"
        + "- 25% of secondary affiliations are stale (end_date set).\n"
        + "- Claims lag of 45-180 days; 10% of claims rows missing HCO attribution.\n"
        + "- Publications include messy institution strings, missing topic tags, and trial role variants.\n"
        + "- 20 duplicate CRM contacts on a legacy ACCTDUP account.\n\n"
        "## Hero HCPs\n\n"
        "- Dr. Arun Patel - Scientific KOL (Great Lakes Health Network UMC, OH)\n"
        "- Dr. Sarah Lin - Regional Stroke Pathway Influencer (GLHN Lakeside Hospital, OH)\n"
        "- Dr. Maria Gomez - Clinical Referral Hub + Community-to-Stroke-Center Bridge (Mercy Acute GLHN, OH)\n"
        "- Dr. Kevin Shaw - Emerging Digital-Responsive Expert (GLHN Riverside Hospital, MI)\n\n"
        "## Hero IDN\n\nGreat Lakes Health Network: 1 academic medical center + 15 hospitals/clinics, 3 stroke centers, ~150-200 affiliated HCPs.\n\n"
        "## How these support the app\n\n"
        "Each source carries useful but incomplete truth. The app must combine IQVIA identity, Definitive hierarchy, claims activity, publications, and CRM engagement to classify archetypes, build the network graph, and surface launch actions. No single file gives the full picture.\n",
        encoding="utf-8",
    )
    print(f"  Wrote {readme}")

    # Summary print
    print("\nSummary")
    print("-------")
    for name, _, _, _ in files:
        prof = profiles[name]
        print(f"  {name}: {prof['row_count']} rows, score {prof['score']}")
    print(f"  Unique HCPs: {len(hcps)}")
    print(f"  HCOs: {len(hcos)}")
    print(f"  Canonical HCPs: {len(canonical_hcps)}")
    print(f"  Network edges: {len(edges)}")
    print(f"  Output folder: {OUT_DIR}")


if __name__ == "__main__":
    main()
