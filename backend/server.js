const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Test Endpoint
app.get('/test', (req, res) => {
    console.log('Test endpoint hit');
    res.json({ success: true, message: 'Test endpoint working' });
});

// Routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const analysisRoutes = require('./routes/analysis');
const cartRoutes = require('./routes/cart');
app.use('/auth', authRoutes);
console.log('Mounting upload routes');
app.use('/upload', uploadRoutes);
app.use('/analysis', analysisRoutes);
app.use('/cart', cartRoutes);

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/anvaya')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

  // Function to call Python script for ML prediction
function getMLPrediction(imagePath, category) {
    return new Promise((resolve, reject) => {
        const normalizedPath = path.resolve(imagePath).replace(/\//g, '\\');
        console.log(`[${new Date().toISOString()}] Checking image path: ${normalizedPath}`);

        // Verify image file exists
        if (!fs.existsSync(normalizedPath)) {
            return reject(new Error(`Image file does not exist at: ${normalizedPath}`));
        }

        const pythonExec = process.platform === 'win32' ? 'python' : 'python3';
        const scriptPath = path.join(__dirname, 'predict.py');

        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Python script not found at: ${scriptPath}`));
        }

        console.log(`[${new Date().toISOString()}] Spawning Python process with: ${pythonExec} ${scriptPath} ${normalizedPath} ${category}`);
        const pythonProcess = spawn(pythonExec, [scriptPath, normalizedPath, category]);
        let data = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
            console.log(`[${new Date().toISOString()}] Python stdout: ${chunk.toString()}`);
        });

        pythonProcess.stderr.on('data', (error) => {
            errorData += error.toString();
            console.log(`[${new Date().toISOString()}] Python stderr: ${error.toString()}`);
        });

        pythonProcess.on('error', (error) => {
            reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });

        pythonProcess.on('close', (code) => {
            console.log(`[${new Date().toISOString()}] Python process exited with code: ${code}`);
            if (code !== 0) {
                return reject(new Error(`Python process exited with code ${code}. stderr: ${errorData}`));
            }
            try {
                const result = JSON.parse(data.trim());
                console.log(`[${new Date().toISOString()}] Python result: ${JSON.stringify(result)}`);
                resolve(result);
            } catch (error) {
                reject(new Error(`Failed to parse Python output: ${error.message}. Output: ${data}, stderr: ${errorData}`));
            }
        });
    });
}

// Hair Commercial Products (Distinct for Each Type-Problem Combination)
const hairStraightDamagedProducts = [
    { name: 'kerastase Resistance Bain Force Architecture ', price: 2540, image: 'kerastase_Resistance_Bain_Force_Architecture.jpg', type: 'Shampoo' },
    { name: 'Briogeo Be Gentle, Be kind aloe+oat milk ultra soothing ', price: 12352, image: 'Briogeo_Be_Gentle,_Be_kind_aloe+oat_milk_ultra_soothing .jpg', type: 'Shampoo' },
    { name: 'Garnier Fructis Damage Eraser', price: 420, image: 'Garnier_Fructis_Damage_Eraser.jpg', type: 'Shampoo' },
    { name: 'Olaplex No-5 Bond Maintenance ', price: 2020, image: 'Olaplex_No-5_Bond_Maintenance .jpg', type: 'Conditioner' },
    { name: 'Briogeo Do not Despair ,Repair !Deep Conditioning Mask', price: 2192, image: 'Briogeo_Dont_Despair,Repair!Deep_Conditioning_Mask.jpg', type: 'Conditioner' },
    { name: 'Garnier Fructis Damage Eraser Conditioner', price: 420, image: 'Garnier_Fructis_Damage_Eraser_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Kerastase Elixir Ultime LHuile Originale Hair Oil', price: 3200, image: 'Kerastase_Elixir_Ultime_LHuile_Originale_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Briogeo Do not DESpair, REpair! Super Moisture Hair Oil', price: 1952, image: 'Briogeo_Dont_DESpair,_REpair!_Super_Moisture_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Garnier Fructis Sleek & Shine Moroccan Sleek OIl treatment ', price: 588, image: 'GarnierFructis_Sleek_&_Shine_Moroccan_Sleek_OIl_treatment .jpg', type: 'Oil' },
];
const hairStraightDandruffProducts = [
    { name: 'Oribe Serene Scalp Anti-Dandruff Shampoo', price: 2864, image: 'Oribe_Serene_Scalp_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Jupiter Balancing Shampoo', price: 2016, image: 'Jupiter_Balancing_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Head & Shoulders Clinical Strength Dandruff ', price: 840, image: 'Head_$_Shoulders_Clinical_Strength_Dandruff .jpg', type: 'Shampoo' },
    { name: 'Oribe Serene Scalp Balancing Conditioner ', price: 3116, image: 'Oribe_Serene_Scalp_Balancing_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Jupiter Restoring Conditioner ', price: 1848, image: 'Jupiter_Restoring_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Head & Shoulders Dandruff Conditioner ', price: 588, image: 'Head_&_Shoulders_Dandruff_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Sisley-Paris Hair Precious Hair Care Oil', price: 4400, image: 'Sisley-Paris_Hair_Precious_Hair_Care_Oil.jpg', type: 'Oil' },
    { name: 'Paul Mitchell Tea Tree Hair and Scalp Treatment Oil', price: 1848, image: 'paul_mitchell_tea_tree_hair_and_scalp_treatment_oil.jpg', type: 'Oil' },
    { name: 'Palmers Tea Tree Oil Scalp Treatment ', price: 672, image: 'Palmer_s_Tea_Tree_Oil_Scalp_Treatment .jpg', type: 'Oil' },
];
const hairStraightDryProducts = [
    { name: 'Moroccanoil Moisture Repair Shampoo', price: 2360, image: 'Moroccanoil_Moisture_Repair_Shampoo.jpg', type: 'Shampoo' },
    { name: 'SheaMoisture Manuka Honey & Mafura Oil Intense Hydration   ', price: 1008, image: 'SheaMoisture_Manuka_Honey_&_Mafura_Oil_Intense_Hydration.jpg', type: 'Shampoo' },
    { name: 'OGX Renewing +Argon Oil of Morocco ', price: 588, image: 'OGX_Renewing_+Argon_Oil_of_Morocco.jpg', type: 'Shampoo' },
    { name: 'Moroccanoil Intense Hydrating Conditioner', price: 3360, image: 'Moroccanoil_Intense_Hydrating_Conditioner.jpg', type: 'Conditioner' },
    { name: 'SheaMoisture Manuka Honey & Mafura Oil Intensive Hydration Conditioner', price: 1008, image: 'SheaMoisture ManukaHoney_&_Mafura_Oil_Intensive_Hydration_Conditioner.jpg', type: 'Conditioner' },
    { name: 'OGX Renewing +Argon Oil of Morocco Conditioner ', price: 672, image: 'OGX_Renewing_+Argon_Oil_of_Morocco_Conditioner .jpg', type: 'Conditioner' },
    { name: 'GisouHoney Infused Hair Oil', price: 3164, image: 'Gisou _Honey_Infused_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Moroccanoil Treatment Original', price: 2540, image: 'Moroccanoil_Treatment_Original.jpg', type: 'Oil' },
    { name: 'OGX Renewing +Argon Oil of Morocco Penetrating Oil ', price: 756, image: 'OGX_Renewing+Argon_Oil_of_Morocco_Penetrating_Oil .jpg', type: 'Oil' },
];
const hairStraightNormalProducts = [
    { name: 'Oribe Gold Lust Repair & Restore Shampoo', price: 3788, image: 'Oribe_Gold_Lust_Repair_&_Restore_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Aveda Rosemary Mint Purifying ', price: 1848, image: 'Aveda_Rosemary_Mint_Purifying .jpg', type: 'Shampoo' },
    { name: 'Herbal Essence Bio :Renew Argan Oil', price: 588, image: 'Herbal_Essence_Bio__Renew_Argan_Oil.jpg', type: 'Shampoo' },
    { name: 'Oribe Gold Lust Repair & Restore Conditioner ', price: 2956, image: 'Oribe_Gold_Lust_Repair_&_Restore_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Rosemary Mint Weightless Conditioner ', price: 2016, image: 'Aveda_Rosemary_Mint_Weightless_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Herbal Essences Bio:Renew Argon Oil Condiitioner ', price: 588, image: 'Herbal_Essences_Bio_Renew_Argon_Oil_Condiitioner.jpg', type: 'Conditioner' },
    { name: 'Oribe Gold Lust Nourishing Hair Oil', price: 2788, image: 'Oribe_Gold_Lust_Nourishing_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Verb Ghost Oil', price: 1680, image: 'Verb_Ghost_Oil.jpg', type: 'Oil' },
    { name: 'LOreal Paris Elvive Extraordinary Oil ', price: 672, image: 'L_Ore_al_Paris_Elvive_Extraordinary_Oil .jpg', type: 'Oil' },
];
const hairStraightOilyProducts = [
    { name: 'R+Co Television Perfect Hair', price: 2688, image: 'R+Co_Television_Perfect_Hair.jpg', type: 'Shampoo' },
    { name: 'Paul Mitchell Tea Tree Special ', price: 1344, image: 'Paul_Mitchell_Tea_Tree_Special .jpg', type: 'Shampoo' },
    { name: 'The Body Ginger Anti Dandruff ', price: 756, image: 'The_Body_Ginger_Anti_Dandruff .jpg', type: 'Shampoo' },
    { name: 'R+Co Television Perfect Hair Conditioner ', price: 1988, image: 'R+Co _Television_Perfect_Hair_conditioner.jpg', type: 'Conditioner' },
    { name: 'PAul Mitchell Tea Tree Special Conditioner ', price: 1344, image: 'Paul_Mitchell_Tea_Tree_Special_conditioner.jpg', type: 'Conditioner' },
    { name: 'Garnier Fructis Sleek & Shine Conditioner ', price: 420, image: 'Garnier_Fructis_Sleek_&_Shine_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Shu Uemura Art of Hair Essence Absolute NOurishiing Protective Oil', price: 3200, image: 'Shu_Uemura_Art_of_Hair_Essence_Absolute_NOurishiing_Protective_Oil.jpg', type: 'Oil' },
    { name: 'Ouai Hair Oil', price: 2352, image: 'Ouai_Hair_Oil.jpg', type: 'Oil' },
    { name: 'The Body Shop GRapeseed Glossing Serum', price: 840, image: 'The_Body_Shop_GRapeseed_Glossing_Serum.jpg', type: 'Oil' },
];
const hairStraightThinningProducts = [
    { name: 'Vegamour GRO revitalizing ', price: 2032, image: 'Vegamour_GRO_revitalizing_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Pura DOr Anti -Thinning Biotin ', price: 1520, image: 'Pura_DOr_Anti-Thinning_Biotin.jpg', type: 'Shampoo' },
    { name: 'LOreal Paris EverPure Volume ', price: 672, image: 'LOreal_Paris_EverPur_Volume_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Vegamour GRO Revitalizing Conditioner', price: 2032, image: 'Vegamour_GRO_revitalizing_conditioner.jpg', type: 'Conditioner' },
    { name: 'Pura DOr Anti-Thinning Biotin Conditioner ', price: 1520, image: 'Pura_DOr_Anti-Thinning_Biotin_conditioner.jpg', type: 'Conditioner' },
    { name: 'LOreal PAris EverPure Volume Conditioner ', price: 672, image: 'LOreal_Paris_EverPure_Volume_conditioner.jpg', type: 'Conditioner' },
    { name: 'Act + Acre Cold pressed Vitamin E Hair oil', price: 3080, image: 'Act+Acre_Cold_pressed_VitaminE_Hair_oil.jpg', type: 'Oil' },
    { name: 'Difeel Rosemary & Mint Hair Oil', price: 2184, image: 'Difeel_Rosemary_&_Mint_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Mielle Organics Rosemary Mint Scalp & Hair Strenthening Oil', price: 504, image: 'Mielle_Organics_Rosemary_Mint_Scalp_&_Hair_Strenthening_Oil.jpg', type: 'Oil' },
];

const hairWavyDamagedProducts = [
    { name: 'Dove Intense Repair Shampoo', price: 250, image: 'Dove_Intense_Repair_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Tresemme Keratin smooth Shampoo', price: 600, image: 'Tresemme_Keratin_smooth_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Olaplex No. 4 Bond Maintenance ', price: 2500, image: 'Olaplex_No.4_Bond_Maintenance.jpg', type: 'Shampoo' },
    { name: 'Tresemme Pro Protect Sulphate-Free Conditioner ', price: 350, image: 'Tresemme_Pro_Protect_Sulphate-Free_Conditioner.jpg', type: 'Conditioner' },
    { name: 'LOreal Paris 6 oil Nourish Conditioner', price: 700, image: 'LOreal_Paris_6_oil_Nourish_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Olaplex No.5 Bond Maintenance ', price: 2500, image: 'Olaplex_No.5 _Bond_Maintenance.jpg', type: 'Conditioner' },
    { name: 'Parachute Advanced Coconut Oil', price: 150, image: 'Parachute_Advanced_Coconut_Oil.jpg', type: 'Oil' },
    { name: 'Karma Ayurveda Bringadi Hair Oil', price: 800, image: 'Karma_Ayurveda_Bringadi_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Moroccanoil Treatment OIl', price: 2200, image: 'Moroccanoil_Treatment_OIl.jpg', type: 'Oil' },
];
const hairWavyDandruffProducts = [
    { name: 'Himalaya Anti Dandruff Shampoo', price: 300, image: 'Himalaya_Anti_Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff  Shampoo', price: 700, image: 'Arata_Anti_Dandruff _Shampoo.jpg', type: 'Shampoo' },
    { name: 'Nizoral Anti_Dandruff Shampoo', price: 1800, image: 'Nizoral_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress', price: 350, image: 'Biotique_Bio_Watercress.jpg', type: 'Conditioner' },
    { name: 'True Frog Anti-Dandruff Conditioner ', price: 600, image: 'True_Frog_Anti-Dandruff_Conditioner.jpg', type: 'Conditioner' },
    { name: 'OUAI Anti-Dandruff Conditioner', price: 2200, image: 'OUAI_Anti-Dandruff_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Soulflower Tea Tree Oil ', price: 350, image: 'Soulflower_Tea_Tree_Oil .jpg', type: 'Oil' },
    { name: 'The Tribe Concepts Anti-Dandruff oil', price: 800, image: 'The_Tribe_Concepts_Anti_Dandruff_oil.jpg', type: 'Oil' },
    { name: 'Kama Ayurveda Anti-Dandruff Hair Oil', price: 1900, image: 'Kama_Ayurveda_Anti-Dandruff_Hair_Oil.jpg', type: 'Oil' },
];
const hairWavyDryProducts = [
    { name: 'Dove Dryness Care Shampoo', price: 300, image: 'Dove_Dryness_Care_Shampoo.jpg', type: 'Shampoo' },
    { name: 'LOreal Paris 6 Oil Nourish Shampoo', price: 650, image: 'LOreal_Paris6_Oil_Nourish_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Morocconoil Hydrating Shampoo', price: 2200, image: 'Morocconoil_Hydrating_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress Conditioner ', price: 350, image: 'Biotique_Bio_Watercress_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Kama Ayurveda Rose & Jasmine Conditioner ', price: 1000, image: 'Kama_Ayurveda_Rose_& Jasmine_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Briogeo Dont Despair, Repair! Conditioner ', price: 2800, image: 'Briogeo_Dont_Despair,_Repair!_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Dabur Vatika Coconut oil ', price: 150, image: 'Dabur_Vatika_Coconut_oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Bhringraj Hair Oil', price: 900, image: 'Forest_Essentials_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'OLAPLEX no.7 Bonding Oil ', price: 2500, image: 'OLAPLEX_no.7_Bonding_Oil.jpg', type: 'Oil' },
];
const hairWavyNormalProducts = [
    { name: 'Sunsilk Nourish & Shine Shampoo', price: 250, image: 'Sunsilk_Nouris_&_Shine_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Earth Rhythm Murumuru Butter Shampoo Bar', price: 400, image: 'Earth_Rhythm_Murumuru_Butter_Shampoo_Bar.jpg', type: 'Shampoo' },
    { name: 'Shea Moisture Coconut & Hibiscus Shampoo', price: 2200, image: 'Shea_Moisture_Coconut_&_Hibiscus_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Pantene Lively Clean Conditioner ', price: 300, image: 'Pantene_Lively_Clean_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner', price: 600, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Nutriplenish Conditioner ', price: 2600, image: 'Aveda_Nutriplenish_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Dabur Amla Hair OIl ', price: 200, image: 'Dabur_Amla_Hair_OIl.jpg', type: 'Oil' },
    { name: 'Biotique Bio Bhringraj Hair Oil', price: 600, image: 'Biotique_Bio_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Sephora Ayurvedic Hair Oil ', price: 2000, image: 'Sephora_Ayurvedic_Hair_Oil .jpg', type: 'Oil' },
];
const hairWavyOilyProducts = [
    { name: 'Garnier Fructis Pure Clean Shampoo', price: 300, image: 'Garnier _Fructis_PureClean_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff Shampoo', price: 700, image: 'Arata_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Briogeo Scalp Revival Charcol Shampoo', price: 2400, image: 'Briogeo_Scalp_Revival_Charcol_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Himalaya Protein Conditioner', price: 250, image: 'Himalaya_rotein_Conditioner.jpg', type: 'Conditioner' },
    { name: 'True Frog Lightweight Conditioner ', price: 600, image: 'True_Frog_Lightweight_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Superzero Serum Treatment Bar', price: 1800, image: 'Superzero_Serum_Treatment_Bar.jpg', type: 'Conditioner' },
    { name: 'Parachute Advanced Aloe Vera Oil', price: 150, image: 'Parachute_Advanced_Aloe_Vera_Oil.jpg', type: 'Oil' },
    { name: 'SoulFlower Rosemary Lavender Oil', price: 400, image: 'SoulFlower_Rosemary_Lavender_Oil.jpg', type: 'Oil' },
    { name: 'Kerastase Eilxir Ultime Oil', price: 2800, image: 'Kerastase_Eilxir_Ultime_Oil.jpg', type: 'Oil' },
];
const hairWavyThinningProducts = [
    { name: 'WOW Skin Science Onion Shampoo', price: 400, image: 'WOW_Skin_Science_Onion_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Just Herbs Anti Hairfall Shampoo', price: 700, image: 'Just_Herbs_Anti_Hairfall_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Keratase Genesis Bain Hydra-Forfiant', price: 2600, image: 'Keratase_Genesis_Bain_Hydra-Forfiant.jpg', type: 'Shampoo' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner ', price: 350, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Earth Rhythm Phyto Curls Conditioner ', price: 800, image: 'Earth_Rhythm_Phyto_Curls_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Invati Advanced Conditioner ', price: 2800, image: 'Aveda_Invati_Advanced_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Mamaearth Onion Hair Oil', price: 400, image: 'Mamaearth_Onion_Hair_Oil.jpg', type: 'Oil' },
    { name: 'The Tribe Concepts Hair Growth oil', price: 900, image: 'The_Tribe_Concepts_Hair_Growth_oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Japapatti Hair Vitalizer', price: 2000, image: 'Forest_Essentials_Japapatti_Hair_Vitalizer.jpg', type: 'Oil' },
];

const hairCurlyDamagedProducts = [
    { name: 'Garnier Fructis Damage Repair Shampoo', price: 300, image: 'Garnier_Fructis_Damage_Repair_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Cantu Sulfate-Free Cleansing Cream Shampoo', price: 800, image: 'Cantu_Sulfate-Free_Cleansing_Cream_Shampoo.jpg', type: 'Shampoo' },
    { name: 'OLAPLEX No. 4 Bond Maintenance Shampoo', price: 2500, image: 'OLAPLEX_No.__Bond_Maintenance_Shampoo.jpg', type: 'Shampoo' },
    { name: 'TRESemmé Pro Protect Conditioner', price: 350, image: 'TRESemmé_Pro_Protect_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Manuka Honey Conditioner', price: 1200, image: 'SheaMoisture ManukaHoney_&_Mafura_Oil_Intensive_Hydration_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Briogeo Don’t Despair, Repair! Conditioner ', price: 2800, image: 'Briogeo_Dont_Despair,_Repair!_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Dabur Vatika Coconut Oil', price: 150, image: '_Dabur_Vatika_Coconut_Oil.jpg', type: 'Oil' },
    { name: 'Kama Ayurveda Bringadi Hair Oil', price: 800, image: 'Karma_Ayurveda_Bringadi_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Moroccanoil Treatment Oil', price: 2200, image: 'Moroccanoil_Treatment_OIl.jpg', type: 'Oil' },
];
const hairCurlyDandruffProducts = [
    { name: 'Himalaya Anti-Dandruff Shampoo', price: 300, image: 'Himalaya_Anti_Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff Shampoo', price: 700, image: 'Arata_Anti_Dandruff _Shampoo.jpg', type: 'Shampoo' },
    { name: 'Nizoral Anti-Dandruff Shampoo', price: 1800, image: 'Nizoral_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress Conditioner', price: 350, image: 'Biotique_Bio_Watercress_Conditioner .jpg', type: 'Conditioner' },
    { name: 'True Frog Anti-Dandruff Conditioner', price: 600, image: 'True_Frog_Anti-Dandruff_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Jamaican Black Castor Oil Conditioner', price: 2200, image: '_Shea_Moisture_Jamaican_Black_Castor_Oil_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Soulflower Tea Tree Essential Oil', price: 350, image: 'Soulflower_Tea_Tree_Oil .jpg', type: 'Oil' },
    { name: ' The Tribe Concepts Anti-Dandruff Oil', price: 800, image: 'The_Tribe_Concepts_Anti_Dandruff_oil.jpg', type: 'Oil' },
    { name: 'Kama Ayurveda Anti-Dandruff Hair Oil', price: 1900, image: 'Kama_Ayurveda_Anti-Dandruff_Hair_Oil.jpg', type: 'Oil' },
];
const hairCurlyDryProducts = [
    { name: 'Dove Dryness Care Shampoo', price: 300, image: 'Dove_Dryness_Care_Shampoo.jpg', type: 'Shampoo' },
    { name: 'L’Oréal Paris 6 Oil Nourish Shampoo', price: 650, image: 'LOreal_Paris6_Oil_Nourish_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Moroccanoil Hydrating Shampoo', price: 2200, image: 'Morocconoil_Hydrating_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress Conditioner', price: 350, image: 'Biotique_Bio_Watercress_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Kama Ayurveda Rose & Jasmine Conditioner', price: 1000, image: 'Kama_Ayurveda_Rose_& Jasmine_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Manuka Honey Conditioner', price: 2200, image: 'SheaMoisture ManukaHoney_&_Mafura_Oil_Intensive_Hydration_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Parachute Advansed Coconut Oil', price: 150, image: 'Parachute_Advanced_Coconut_Oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Bhringraj Hair Oil', price: 900, image: 'Forest_Essentials_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'OLAPLEX No. 7 Bonding Oil', price: 2500, image: 'OLAPLEX_no.7_Bonding_Oil.jpg', type: 'Oil' },
];
const hairCurlyNormalProducts = [
    { name: 'Sunsilk Nourish & Shine Shampoo', price: 250, image: 'Sunsilk_Nouris_&_Shine_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Earth Rhythm Murumuru Butter Shampoo Bar', price: 400, image: 'Earth_Rhythm_Murumuru_Butter_Shampoo_Bar.jpg', type: 'Shampoo' },
    { name: 'Shea Moisture Coconut & Hibiscus Shampoo', price: 2200, image: 'Shea_Moisture_Coconut_&_Hibiscus_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Pantene Lively Clean Conditioner ', price: 300, image: 'Pantene_Lively_Clean_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner', price: 600, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Nutriplenish Conditioner ', price: 2600, image: 'Aveda_Nutriplenish_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Dabur Amla Hair OIl ', price: 200, image: 'Dabur_Amla_Hair_OIl.jpg', type: 'Oil' },
    { name: 'Biotique Bio Bhringraj Hair Oil', price: 600, image: 'Biotique_Bio_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Sephora Ayurvedic Hair Oil ', price: 2000, image: 'Sephora_Ayurvedic_Hair_Oil .jpg', type: 'Oil' },
];
const hairCurlyOilyProducts = [
    { name: 'Garnier Fructis Pure Clean Shampoo', price: 300, image: 'Garnier _Fructis_PureClean_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff Shampoo', price: 700, image: 'Arata_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Briogeo Scalp Revival Charcol Shampoo', price: 2400, image: 'Briogeo_Scalp_Revival_Charcol_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Himalaya Protein Conditioner', price: 250, image: 'Himalaya_rotein_Conditioner.jpg', type: 'Conditioner' },
    { name: 'True Frog Lightweight Conditioner ', price: 600, image: 'True_Frog_Lightweight_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Superzero Serum Treatment Bar', price: 1800, image: 'Superzero_Serum_Treatment_Bar.jpg', type: 'Conditioner' },
    { name: 'Parachute Advanced Aloe Vera Oil', price: 150, image: 'Parachute_Advanced_Aloe_Vera_Oil.jpg', type: 'Oil' },
    { name: 'SoulFlower Rosemary Lavender Oil', price: 400, image: 'SoulFlower_Rosemary_Lavender_Oil.jpg', type: 'Oil' },
    { name: 'Kerastase Eilxir Ultime Oil', price: 2800, image: 'Kerastase_Eilxir_Ultime_Oil.jpg', type: 'Oil' },
];
const hairCurlyThinningProducts = [
    { name: 'WOW Skin Science Onion Shampoo', price: 400, image: 'WOW_Skin_Science_Onion_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Just Herbs Anti Hairfall Shampoo', price: 700, image: 'Just_Herbs_Anti_Hairfall_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Keratase Genesis Bain Hydra-Forfiant', price: 2600, image: 'Keratase_Genesis_Bain_Hydra-Forfiant.jpg', type: 'Shampoo' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner ', price: 350, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Earth Rhythm Phyto Curls Conditioner ', price: 800, image: 'Earth_Rhythm_Phyto_Curls_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Invati Advanced Conditioner ', price: 2800, image: 'Aveda_Invati_Advanced_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Mamaearth Onion Hair Oil', price: 400, image: 'Mamaearth_Onion_Hair_Oil.jpg', type: 'Oil' },
    { name: 'The Tribe Concepts Hair Growth oil', price: 900, image: 'The_Tribe_Concepts_Hair_Growth_oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Japapatti Hair Vitalizer', price: 2000, image: 'Forest_Essentials_Japapatti_Hair_Vitalizer.jpg', type: 'Oil' },
];

const hairCoilyDamagedProducts = [
     { name: 'Garnier Fructis Damage Repair Shampoo', price: 300, image: 'Garnier_Fructis_Damage_Repair_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Cantu Sulfate-Free Cleansing Cream Shampoo', price: 800, image: 'Cantu_Sulfate-Free_Cleansing_Cream_Shampoo.jpg', type: 'Shampoo' },
    { name: 'OLAPLEX No. 4 Bond Maintenance Shampoo', price: 2500, image: 'OLAPLEX_No.__Bond_Maintenance_Shampoo.jpg', type: 'Shampoo' },
    { name: 'TRESemmé Pro Protect Conditioner', price: 350, image: 'TRESemmé_Pro_Protect_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Manuka Honey Conditioner', price: 1200, image: 'SheaMoisture ManukaHoney_&_Mafura_Oil_Intensive_Hydration_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Briogeo Don’t Despair, Repair! Conditioner ', price: 2800, image: 'Briogeo_Dont_Despair,_Repair!_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Dabur Vatika Coconut Oil', price: 150, image: '_Dabur_Vatika_Coconut_Oil.jpg', type: 'Oil' },
    { name: 'Kama Ayurveda Bringadi Hair Oil', price: 800, image: 'Karma_Ayurveda_Bringadi_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Moroccanoil Treatment Oil', price: 2200, image: 'Moroccanoil_Treatment_OIl.jpg', type: 'Oil' },
];
const hairCoilyDandruffProducts = [
    { name: 'Himalaya Anti-Dandruff Shampoo', price: 300, image: 'Himalaya_Anti_Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff Shampoo', price: 700, image: 'Arata_Anti_Dandruff _Shampoo.jpg', type: 'Shampoo' },
    { name: 'Nizoral Anti-Dandruff Shampoo', price: 1800, image: 'Nizoral_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress Conditioner', price: 350, image: 'Biotique_Bio_Watercress_Conditioner .jpg', type: 'Conditioner' },
    { name: 'True Frog Anti-Dandruff Conditioner', price: 600, image: 'True_Frog_Anti-Dandruff_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Jamaican Black Castor Oil Conditioner', price: 2200, image: '_Shea_Moisture_Jamaican_Black_Castor_Oil_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Soulflower Tea Tree Essential Oil', price: 350, image: 'Soulflower_Tea_Tree_Oil .jpg', type: 'Oil' },
    { name: ' The Tribe Concepts Anti-Dandruff Oil', price: 800, image: 'The_Tribe_Concepts_Anti_Dandruff_oil.jpg', type: 'Oil' },
    { name: 'Kama Ayurveda Anti-Dandruff Hair Oil', price: 1900, image: 'Kama_Ayurveda_Anti-Dandruff_Hair_Oil.jpg', type: 'Oil' },
];
const hairCoilyDryProducts = [
    { name: 'Dove Dryness Care Shampoo', price: 300, image: 'Dove_Dryness_Care_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Cantu Sulfate-Free Cleansing Cream Shampoo', price: 800, image: 'Cantu_Sulfate-Free_Cleansing_Cream_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Moroccanoil Hydrating Shampoo', price: 2200, image: 'Morocconoil_Hydrating_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Biotique Bio Watercress Conditioner', price: 350, image: 'Biotique_Bio_Watercress_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Shea Moisture Manuka Honey Conditioner', price: 2200, image: 'SheaMoisture ManukaHoney_&_Mafura_Oil_Intensive_Hydration_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Pattern Beauty Heavy Conditioner', price: 2600, image: 'Pattern_Beauty_Heavy_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Parachute Advansed Coconut Oil', price: 150, image: 'Parachute_Advanced_Coconut_Oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Bhringraj Hair Oil', price: 900, image: 'Forest_Essentials_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'OLAPLEX No. 7 Bonding Oil', price: 2500, image: 'OLAPLEX_no.7_Bonding_Oil.jpg', type: 'Oil' },
];
const hairCoilyNormalProducts = [
    { name: 'Sunsilk Nourish & Shine Shampoo', price: 250, image: 'Sunsilk_Nouris_&_Shine_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Earth Rhythm Murumuru Butter Shampoo Bar', price: 400, image: 'Earth_Rhythm_Murumuru_Butter_Shampoo_Bar.jpg', type: 'Shampoo' },
    { name: 'Shea Moisture Coconut & Hibiscus Shampoo', price: 2200, image: 'Shea_Moisture_Coconut_&_Hibiscus_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Pantene Lively Clean Conditioner ', price: 300, image: 'Pantene_Lively_Clean_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner', price: 600, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Nutriplenish Conditioner ', price: 2600, image: 'Aveda_Nutriplenish_Conditioner .jpg', type: 'Conditioner' },
    { name: 'Dabur Amla Hair OIl ', price: 200, image: 'Dabur_Amla_Hair_OIl.jpg', type: 'Oil' },
    { name: 'Biotique Bio Bhringraj Hair Oil', price: 600, image: 'Biotique_Bio_Bhringraj_Hair_Oil.jpg', type: 'Oil' },
    { name: 'Sephora Ayurvedic Hair Oil ', price: 2000, image: 'Sephora_Ayurvedic_Hair_Oil .jpg', type: 'Oil' },
];
const hairCoilyOilyProducts = [
    { name: 'Garnier Fructis Pure Clean Shampoo', price: 300, image: 'Garnier _Fructis_PureClean_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Arata Anti-Dandruff Shampoo', price: 700, image: 'Arata_Anti-Dandruff_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Briogeo Scalp Revival Charcol Shampoo', price: 2400, image: 'Briogeo_Scalp_Revival_Charcol_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Himalaya Protein Conditioner', price: 250, image: 'Himalaya_rotein_Conditioner.jpg', type: 'Conditioner' },
    { name: 'True Frog Lightweight Conditioner ', price: 600, image: 'True_Frog_Lightweight_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Pattern Beauty Lightweight Conditioner', price: 2200, image: 'Pattern_Beauty_light_weight_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Parachute Advanced Aloe Vera Oil', price: 150, image: 'Parachute_Advanced_Aloe_Vera_Oil.jpg', type: 'Oil' },
    { name: 'SoulFlower Rosemary Lavender Oil', price: 400, image: 'SoulFlower_Rosemary_Lavender_Oil.jpg', type: 'Oil' },
    { name: 'Kerastase Eilxir Ultime Oil', price: 2800, image: 'Kerastase_Eilxir_Ultime_Oil.jpg', type: 'Oil' },
];
const hairCoilyThinningProducts = [
    { name: 'WOW Skin Science Onion Shampoo', price: 400, image: 'WOW_Skin_Science_Onion_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Just Herbs Anti Hairfall Shampoo', price: 700, image: 'Just_Herbs_Anti_Hairfall_Shampoo.jpg', type: 'Shampoo' },
    { name: 'Keratase Genesis Bain Hydra-Forfiant', price: 2600, image: 'Keratase_Genesis_Bain_Hydra-Forfiant.jpg', type: 'Shampoo' },
    { name: 'Biotique Thyme Volume & Bounce Conditioner ', price: 350, image: 'Biotique_Thyme_Volume_&_Bounce_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Earth Rhythm Phyto Curls Conditioner ', price: 800, image: 'Earth_Rhythm_Phyto_Curls_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Aveda Invati Advanced Conditioner ', price: 2800, image: 'Aveda_Invati_Advanced_Conditioner.jpg', type: 'Conditioner' },
    { name: 'Mamaearth Onion Hair Oil', price: 400, image: 'Mamaearth_Onion_Hair_Oil.jpg', type: 'Oil' },
    { name: 'The Tribe Concepts Hair Growth oil', price: 900, image: 'The_Tribe_Concepts_Hair_Growth_oil.jpg', type: 'Oil' },
    { name: 'Forest Essentials Japapatti Hair Vitalizer', price: 2000, image: 'Forest_Essentials_Japapatti_Hair_Vitalizer.jpg', type: 'Oil' },
];

// Hair Natural Remedies (Distinct for Each Type-Problem Combination)
const hairStraightDamagedRemedies = [
    { name: 'Shikakai-Amla Wash', ingredients: '2 tbsp shikakai powder, 1 tbsp amla powder, 1 cup water.', procedure: 'Boil water, add powders, simmer 10 min, strain.', usage: 'Apply to wet hair, massage 5 min, rinse. Use twice weekly.', type: 'Shampoo' },
    { name: 'Hibiscus-Reetha  Shampoo', ingredients: '5 hibiscus leaves, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, blend with hibiscus, boil, strain.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Shikakai Gel ', ingredients: '2 tbsp aloe vera gel, 1 tbsp shikakai powder, ½ cup water.', procedure: 'Blend ingredients into a smooth liquid.', usage: 'Apply to hair, massage, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Banana-Honey Mix', ingredients: '1 ripe banana, 1 tbsp honey, 1 tbsp curd.', procedure: 'Mash banana, mix with honey and curd.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Avocado-Yogurt Blend', ingredients: '½ avocado, 2 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mash avocado, blend with yogurt and oil.', usage: 'Apply to lengths, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Aloe Conditioner', ingredients: '3 tbsp coconut milk, 1 tbsp aloe vera gel, 1 tsp almond oil.', procedure: 'Mix all ingredients until smooth.', usage: 'Apply after cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Almond-Coconut Blend ', ingredients: '2 tbsp almond oil, 1 tbsp coconut oil, 2 drops lavender oil.', procedure: 'Warm oils, add lavender.', usage: 'Massage into scalp and hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Argan-Castor Oil', ingredients: '1 tbsp argan oil, 1 tbsp castor oil, 1 tsp sesame oil.', procedure: 'Mix oils, warm slightly.', usage: 'Apply to hair, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Amla-Olive Oil', ingredients: '2 tbsp amla oil, 1 tbsp olive oil.', procedure: 'Combine and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Egg-Olive Oil Mask ', ingredients: '1 egg, 1 tbsp olive oil, 1 tbsp honey.', procedure: 'Whisk egg, mix with oil and honey.', usage: 'Apply to hair, leave 30 min, rinse and cleanse. Use weekly.', type: 'Mask' },
    { name: 'Curd-Amla Mask ', ingredients: '3 tbsp curd, 1 tbsp amla powder, 1 tsp lemon juice.', procedure: 'Mix into a smooth paste.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Coconut Mask ', ingredients: '5 hibiscus flowers, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Blend flowers into paste, mix with milk and honey.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
];
const hairStraightDandruffRemedies = [
    { name: 'Neem Leaf Paste ', ingredients: '10 neem leaves, ½ cup water.', procedure: 'Blend leaves with water, strain.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Tea Tree-Shikakai Mix ', ingredients: '1 tbsp shikakai powder, 3 drops tea tree oil, 1 cup water.', procedure: 'Mix powder with water, add oil.', usage: 'Apply to scalp, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Fenugreek Water ', ingredients: '2 tbsp fenugreek seeds, 1 cup water.', procedure: 'Soak seeds overnight, strain.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Yogurt-Lemon Blend ', ingredients: '3 tbsp yogurt, 1 tsp lemon juice, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Aloe Vera-Curd Mix ', ingredients: '2 tbsp aloe vera gel, 2 tbsp curd, 1 tsp neem powder.', procedure: 'Blend into a smooth paste.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Mint-Yogurt Conditioner ', ingredients: '10 mint leaves, 3 tbsp yogurt, 1 tsp lemon juice.', procedure: 'Blend mint with yogurt, add lemon.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Neem-Coconut Oil ', ingredients: '2 tbsp coconut oil, 5 drops neem oil.', procedure: 'Warm coconut oil, add neem oil.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Tea Tree-Sesame Oil ', ingredients: '2 tbsp sesame oil, 3 drops tea tree oil.', procedure: 'Mix oils, warm slightly.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Lemon-Coconut Oil ', ingredients: '2 tbsp coconut oil, 1 tsp lemon juice.', procedure: 'Mix gently, warm.', usage: 'Massage into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Fenugreek-Lemon Mask ', ingredients: '2 tbsp fenugreek powder, 1 tbsp lemon juice, 2 tbsp curd.', procedure: 'Soak fenugreek in curd overnight, add lemon.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Curd-Neem Mask ', ingredients: '3 tbsp curd, 1 tbsp neem powder, 1 tsp honey.', procedure: 'Mix into a paste.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Tea Tree-Yogurt Mask', ingredients: '3 tbsp yogurt, 3 drops tea tree oil, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairStraightDryRemedies = [
    { name: 'Hibiscus-Shikakai Wash', ingredients: '5 hibiscus flowers, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend flowers, mix with shikakai and water, strain.', usage: 'Massage into hair, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Reetha-Aloe  Shampoo', ingredients: '5 reetha nuts, 1 tbsp aloe vera gel, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, add aloe.', usage: 'Apply to hair, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Coconut Milk Wash ', ingredients: '½ cup coconut milk, ½ cup water.', procedure: 'Dilute coconut milk with water.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Coconut Milk-Banana Mix ', ingredients: '3 tbsp coconut milk, 1 ripe banana, 1 tsp honey.', procedure: 'Mash banana, blend with milk and honey.', usage: 'Apply post-cleansing, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Shea Butter-Aloe Blend', ingredients: '1 tbsp shea butter, 2 tbsp aloe vera gel, 1 tsp olive oil.', procedure: 'Melt shea butter, mix with aloe and oil.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Avocado-Honey Conditioner ', ingredients: '½ avocado, 1 tbsp honey, 1 tbsp curd.', procedure: 'Mash avocado, mix with honey and curd.', usage: 'Apply to lengths, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Sesame-Coconut Oil ', ingredients: '2 tbsp sesame oil, 1 tbsp coconut oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp and hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Castor-Olive Oil ', ingredients: '1 tbsp castor oil, 1 tbsp olive oil, 2 drops rosemary oil.', procedure: 'Mix oils, warm slightly.', usage: 'Apply to hair, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Almond-Argan Oil ', ingredients: '2 tbsp almond oil, 1 tbsp argan oil.', procedure: 'Combine and warm.', usage: 'Massage into hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Avocado-Honey Mask ', ingredients: '½ avocado, 2 tbsp honey, 1 tbsp coconut milk.', procedure: 'Mash avocado, mix with honey and milk.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Curd-Egg Mask ', ingredients: '3 tbsp curd, 1 egg, 1 tsp olive oil.', procedure: 'Whisk egg, mix with curd and oil.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Banana-Coconut Mask ', ingredients: '1 ripe banana, 2 tbsp coconut milk, 1 tsp almond oil.', procedure: 'Mash banana, blend with milk and oil.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
];
const hairStraightNormalRemedies = [
    { name: 'Amla-Shikakai Wash ', ingredients: '1 tbsp amla powder, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Boil powders in water, strain.', usage: 'Massage into hair, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Rose Petal  Shampoo', ingredients: '10 rose petals, 1 cup water.', procedure: 'Boil petals in water, strain.', usage: 'Apply to hair, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Hibiscus Leaf Wash ', ingredients: '10 hibiscus leaves, 1 cup water.', procedure: 'Blend leaves with water, strain.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Honey Mix ', ingredients: '2 tbsp aloe vera gel, 1 tbsp honey, 1 tsp coconut milk.', procedure: 'Blend all ingredients.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Rose Blend ', ingredients: '3 tbsp yogurt, 1 tbsp rose water, 1 tsp almond oil.', procedure: 'Mix into a smooth paste.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Conditioner ', ingredients: '3 tbsp coconut milk, 1 tsp lemon juice, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Oil ', ingredients: '2 tbsp coconut oil, 2 drops lavender oil.', procedure: 'Warm coconut oil, add lavender.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Brahmi Oil ', ingredients: '2 tbsp brahmi oil, 1 tbsp almond oil.', procedure: 'Mix and warm gently.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Sesame Oil ', ingredients: '2 tbsp sesame oil, 1 tsp rose water.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Hibiscus-Yogurt Mask ', ingredients: '5 hibiscus flowers, 3 tbsp yogurt, 1 tsp honey.', procedure: 'Blend flowers, mix with yogurt and honey.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Amla-Curd Mask ', ingredients: '1 tbsp amla powder, 3 tbsp curd, 1 tsp olive oil.', procedure: 'Mix into a paste.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Rose-Coconut Mask ', ingredients: '10 rose petals, 2 tbsp coconut milk, 1 tsp aloe vera gel.', procedure: 'Blend petals, mix with milk and aloe.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairStraightOilyRemedies = [
    { name: 'Multani Mitti Wash ', ingredients: '2 tbsp multani mitti, ½ cup water, 1 tsp lemon juice.', procedure: 'Mix into a thin paste.', usage: 'Apply to scalp, massage, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Lemon-Shikakai  Shampoo', ingredients: '1 tbsp shikakai powder, 1 tsp lemon juice, 1 cup water.', procedure: 'Mix powder with water, add lemon.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Mint-Reetha Wash ', ingredients: '10 mint leaves, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, boil with mint, strain.', usage: 'Apply to hair, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Lemon Mix ', ingredients: '2 tbsp aloe vera gel, 1 tsp lemon juice, 1 tsp rose water.', procedure: 'Blend all ingredients.', usage: 'Apply post-cleansing, leave 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Curd-Mint Blend ', ingredients: '3 tbsp curd, 10 mint leaves, 1 tsp lemon juice.', procedure: 'Blend mint with curd, add lemon.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Green Tea-Yogurt Conditioner ', ingredients: '2 tbsp yogurt, 1 tbsp green tea (brewed, cooled), 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Jojoba Oil ', ingredients: '2 tbsp jojoba oil, 2 drops tea tree oil.', procedure: 'Mix oils.', usage: 'Massage lightly into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Tea Tree-Coconut Oil ', ingredients: '1 tbsp coconut oil, 3 drops tea tree oil.', procedure: 'Mix and warm slightly.', usage: 'Apply to scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Grapeseed Oil ', ingredients: '2 tbsp grapeseed oil, 1 tsp lemon extract.', procedure: 'Mix together.', usage: 'Massage into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Multani Mitti-Rose Mask ', ingredients: '2 tbsp multani mitti, 1 tbsp rose water, 1 tsp lemon juice.', procedure: 'Mix into a paste.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Lemon-Yogurt Mask ', ingredients: '3 tbsp yogurt, 1 tbsp lemon juice, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Mint-Clay Mask ', ingredients: '2 tbsp bentonite clay, 10 mint leaves, ½ cup water.', procedure: 'Blend mint with water, mix with clay.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairStraightThinningRemedies = [
    { name: 'Fenugreek-Reetha Wash ', ingredients: '2 tbsp fenugreek seeds, 5 reetha nuts, 2 cups water.', procedure: 'Soak fenugreek and reetha overnight, boil, strain.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Amla-Shikakai  Shampoo', ingredients: '1 tbsp amla powder, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Boil powders in water, strain.', usage: 'Apply to scalp, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Brahmi Wash ', ingredients: '1 tbsp brahmi powder, 1 cup water.', procedure: 'Mix powder with water, strain.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Yogurt Mix ', ingredients: '1 tbsp brahmi powder, 3 tbsp yogurt, 1 tsp honey.', procedure: 'Mix into a smooth paste.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Aloe Vera-Fenugreek Blend ', ingredients: '2 tbsp aloe vera gel, 1 tbsp fenugreek paste, 1 tsp coconut milk.', procedure: 'Blend all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Onion Juice-Curd Conditioner ', ingredients: '1 tbsp onion juice, 3 tbsp curd, 1 tsp olive oil.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Bhringraj Oil ', ingredients: '2 tbsp bhringraj oil, 1 tbsp coconut oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Castor-Rosemary Oil ', ingredients: '1 tbsp castor oil, 1 tbsp almond oil, 3 drops rosemary oil.', procedure: 'Mix oils, warm slightly.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Amla-Fenugreek Oil ', ingredients: '2 tbsp amla oil, 1 tbsp fenugreek oil.', procedure: 'Combine and warm.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Onion-Honey Mask ', ingredients: '2 tbsp onion juice, 1 tbsp honey, 1 tbsp curd.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Fenugreek-Amla Mask ', ingredients: '2 tbsp fenugreek powder, 1 tbsp amla powder, 2 tbsp curd.', procedure: 'Soak fenugreek in curd overnight, add amla.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Brahmi-Egg Mask ', ingredients: '1 tbsp brahmi powder, 1 egg, 1 tbsp olive oil.', procedure: 'Whisk egg, mix with brahmi and oil.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];

const hairWavyDamagedRemedies = [
    { name: 'Shikakai-Reetha Wash ', ingredients: '1 tbsp shikakai powder, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, boil with shikakai, strain.', usage: 'Massage into hair, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Hibiscus  Shampoo', ingredients: '2 tbsp aloe vera gel, 5 hibiscus flowers, 1 cup water.', procedure: 'Blend flowers with aloe and water, strain.', usage: 'Apply to hair, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Coconut Milk-Shikakai Wash ', ingredients: '½ cup coconut milk, 1 tbsp shikakai powder, ½ cup water.', procedure: 'Mix all ingredients.', usage: 'Massage into hair, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Avocado-Shea Butter Mix ', ingredients: '½ avocado, 1 tbsp shea butter, 1 tbsp coconut milk.', procedure: 'Mash avocado, melt shea butter, mix with milk.', usage: 'Apply to lengths, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Coconut Conditioner ', ingredients: '1 ripe banana, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Mash banana, blend with milk and honey.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Olive Oil Blend ', ingredients: '3 tbsp yogurt, 1 tbsp olive oil, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Argan-Coconut Oil ', ingredients: '1 tbsp argan oil, 1 tbsp coconut oil, 2 drops lavender oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Almond-Castor Oil ', ingredients: '2 tbsp almond oil, 1 tbsp castor oil.', procedure: 'Combine and warm.', usage: 'Apply to hair, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Amla-Sesame Oil ', ingredients: '2 tbsp amla oil, 1 tbsp sesame oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Egg-Coconut Milk Mask ', ingredients: '1 egg, 2 tbsp coconut milk, 1 tbsp honey.', procedure: 'Whisk egg, mix with milk and honey.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Avocado Mask ', ingredients: '5 hibiscus flowers, ½ avocado, 1 tbsp curd.', procedure: 'Blend flowers and avocado, mix with curd.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Curd-Olive Oil Mask ', ingredients: '3 tbsp curd, 1 tbsp olive oil, 1 tsp lemon juice.', procedure: 'Mix into a paste.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairWavyDandruffRemedies = [
    { name: 'Neem-Tea Tree Wash ', ingredients: '10 neem leaves, 3 drops tea tree oil, 1 cup water.', procedure: 'Blend neem with water, strain, add tea tree oil.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Fenugreek-Shikakai  Shampoo', ingredients: '2 tbsp fenugreek seeds, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Soak fenugreek overnight, blend with shikakai and water.', usage: 'Apply to scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Lemon-Reetha Wash ', ingredients: '5 reetha nuts, 1 tsp lemon juice, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, add lemon.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Yogurt-Neem Blend ', ingredients: '3 tbsp yogurt, 1 tbsp neem powder, 1 tsp lemon juice.', procedure: 'Mix into a smooth paste.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Aloe Vera-Tea Tree Mix ', ingredients: '2 tbsp aloe vera gel, 3 drops tea tree oil, 1 tsp curd.', procedure: 'Blend all ingredients.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Mint-Lemon Conditioner ', ingredients: '10 mint leaves, 1 tsp lemon juice, 2 tbsp yogurt.', procedure: 'Blend mint with yogurt, add lemon.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Tea Tree-Coconut Oil ', ingredients: '2 tbsp coconut oil, 3 drops tea tree oil.', procedure: 'Mix and warm slightly.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Neem-Sesame Oil ', ingredients: '1 tbsp neem oil, 1 tbsp sesame oil.', procedure: 'Mix oils, warm gently.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Lemon-Almond Oil ', ingredients: '2 tbsp almond oil, 1 tsp lemon juice.', procedure: 'Mix gently, warm.', usage: 'Massage into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Curd-Tea Tree Mask ', ingredients: '3 tbsp curd, 3 drops tea tree oil, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Fenugreek-Neem Mask ', ingredients: '2 tbsp fenugreek powder, 1 tbsp neem powder, 2 tbsp curd.', procedure: 'Soak fenugreek in curd overnight, add neem.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Lemon-Yogurt Mask ', ingredients: '3 tbsp yogurt, 1 tbsp lemon juice, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairWavyDryRemedies = [
    { name: 'Coconut Milk-Hibiscus Wash ', ingredients: '½ cup coconut milk, 5 hibiscus flowers, ½ cup water.', procedure: 'Blend flowers with milk and water, strain.', usage: 'Massage into hair, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Reetha-Aloe  Shampoo', ingredients: '5 reetha nuts, 1 tbsp aloe vera gel, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, add aloe.', usage: 'Apply to hair, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Shikakai-Shea Wash ', ingredients: '1 tbsp shikakai powder, 1 tsp shea butter, 1 cup water.', procedure: 'Mix powder with water, melt shea butter, combine.', usage: 'Massage into hair, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Shea Butter-Coconut Mix ', ingredients: '1 tbsp shea butter, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Melt shea butter, mix with milk and honey.', usage: 'Apply to lengths, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Avocado-Yogurt Blend ', ingredients: '½ avocado, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mash avocado, mix with yogurt and oil.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Aloe Conditioner ', ingredients: '1 ripe banana, 2 tbsp aloe vera gel, 1 tsp almond oil.', procedure: 'Mash banana, blend with aloe and oil.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut-Sesame Oil ', ingredients: '2 tbsp coconut oil, 1 tbsp sesame oil, 2 drops rosemary oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Argan-Olive Oil ', ingredients: '1 tbsp argan oil, 1 tbsp olive oil.', procedure: 'Combine and warm.', usage: 'Apply to hair, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Castor-Almond Oil ', ingredients: '1 tbsp castor oil, 1 tbsp almond oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut Milk-Honey Mask ', ingredients: '3 tbsp coconut milk, 2 tbsp honey, 1 tsp olive oil.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Avocado-Egg Mask ', ingredients: '½ avocado, 1 egg, 1 tbsp curd.', procedure: 'Mash avocado, whisk egg, mix with curd.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Shea Mask ', ingredients: '5 hibiscus flowers, 1 tbsp shea butter, 1 tbsp coconut milk.', procedure: 'Blend flowers, melt shea butter, mix with milk.', usage: 'Apply to hair, leave 30 min, rinse. Use weekly.', type: 'Mask' },
];
const hairWavyNormalRemedies = [
    { name: 'Hibiscus-Shikakai Wash ', ingredients: '5 hibiscus flowers, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend flowers with shikakai and water, strain.', usage: 'Massage into hair, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Rose-Amla  Shampoo', ingredients: '10 rose petals, 1 tbsp amla powder, 1 cup water.', procedure: 'Boil petals and amla, strain.', usage: 'Apply to hair, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha Wash ', ingredients: '5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain.', usage: 'Massage into hair, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Rose Mix ', ingredients: '2 tbsp aloe vera gel, 1 tbsp rose water, 1 tsp honey.', procedure: 'Blend all ingredients.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Yogurt Blend ', ingredients: '2 tbsp coconut milk, 2 tbsp yogurt, 1 tsp almond oil.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Hibiscus-Curd Conditioner ', ingredients: '5 hibiscus flowers, 3 tbsp curd, 1 tsp lemon juice.', procedure: 'Blend flowers, mix with curd and lemon.', usage: 'Apply to hair, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Almond Oil ', ingredients: '2 tbsp almond oil, 2 drops lavender oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Brahmi-Coconut Oil ', ingredients: '1 tbsp brahmi oil, 1 tbsp coconut oil.', procedure: 'Mix and warm gently.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Sesame Oil ', ingredients: 'Ingredients : 2 tbsp sesame oil, 1 tsp rose water.', procedure: 'Mix together.', usage: 'Massage into hair, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Hibiscus-Coconut Mask ', ingredients: '5 hibiscus flowers, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Blend flowers, mix with milk and honey.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Amla-Yogurt Mask ', ingredients: '1 tbsp amla powder, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mix into a paste.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Rose-Curd Mask ', ingredients: '10 rose petals, 3 tbsp curd, 1 tsp aloe vera gel.', procedure: 'Blend petals, mix with curd and aloe.', usage: 'Apply to hair, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairWavyOilyRemedies = [
    { name: 'Multani Mitti-Lemon Wash ', ingredients: '2 tbsp multani mitti, 1 tsp lemon juice, ½ cup water.', procedure: 'Mix into a thin paste.', usage: 'Apply to scalp, massage, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Mint-Shikakai  Shampoo', ingredients: '10 mint leaves, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend mint with water, mix with shikakai.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha-Lemon Wash ', ingredients: '5 reetha nuts, 1 tsp lemon juice, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, add lemon.', usage: 'Apply to scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Mint Mix ', ingredients: '2 tbsp aloe vera gel, 10 mint leaves, 1 tsp lemon juice.', procedure: 'Blend mint with aloe, add lemon.', usage: 'Apply post-cleansing, leave 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Lemon Blend ', ingredients: '3 tbsp yogurt, 1 tsp lemon juice, 1 tsp rose water.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Green Tea-Aloe Conditioner ', ingredients: '1 tbsp green tea (brewed, cooled), 2 tbsp aloe vera gel, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to hair, leave 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Jojoba-Tea Tree Oil ', ingredients: '2 tbsp jojoba oil, 3 drops tea tree oil.', procedure: 'Mix oils.', usage: 'Massage lightly into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Grapeseed Oil ', ingredients: '2 tbsp grapeseed oil, 1 tsp lemon extract.', procedure: 'Mix together.', usage: 'Apply to scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut-Lemon Oil ', ingredients: '1 tbsp coconut oil, 1 tsp lemon juice.', procedure: 'Mix gently, warm.', usage: 'Massage into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Multani Mitti-Yogurt Mask ', ingredients: '2 tbsp multani mitti, 2 tbsp yogurt, 1 tsp lemon juice.', procedure: 'Mix into a paste.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Mint-Lemon Mask ', ingredients: '10 mint leaves, 1 tbsp lemon juice, 2 tbsp curd.', procedure: 'Blend mint with curd, add lemon.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Clay-Rose Mask ', ingredients: '2 tbsp bentonite clay, 1 tbsp rose water, 1 tsp aloe vera gel.', procedure: 'Mix into a paste.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairWavyThinningRemedies = [
    { name: 'Fenugreek-Amla Wash ', ingredients: '2 tbsp fenugreek seeds, 1 tbsp amla powder, 1 cup water.', procedure: '2 tbsp fenugreek seeds, 1 tbsp amla powder, 1 cup water.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Reetha  Shampoo', ingredients: '1 tbsp brahmi powder, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, boil with brahmi, strain.', usage: 'Apply to scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Onion-Shikakai Wash ', ingredients: '1 tbsp onion juice, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Mix all ingredients.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Aloe Mix ', ingredients: '1 tbsp brahmi powder, 2 tbsp aloe vera gel, 1 tsp curd.', procedure: 'Mix into a smooth paste.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Fenugreek-Yogurt Blend ', ingredients: '1 tbsp fenugreek paste, 3 tbsp yogurt, 1 tsp honey.', procedure: 'Blend fenugreek with yogurt, add honey.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Onion-Coconut Conditioner ', ingredients: '1 tbsp onion juice, 2 tbsp coconut milk, 1 tsp olive oil.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Bhringraj-Castor Oil ', ingredients: '2 tbsp bhringraj oil, 1 tbsp castor oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Rosemary-Coconut Oil ', ingredients: '2 tbsp coconut oil, 3 drops rosemary oil.', procedure: 'Mix oils, warm slightly.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Amla-Fenugreek Oil ', ingredients: '2 tbsp amla oil, 1 tbsp fenugreek oil.', procedure: 'Combine and warm.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Onion-Fenugreek Mask ', ingredients: '2 tbsp onion juice, 2 tbsp fenugreek powder, 1 tbsp curd.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Brahmi-Amla Mask ', ingredients: '1 tbsp brahmi powder, 1 tbsp amla powder, 2 tbsp yogurt.', procedure: 'Mix into a paste.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Egg-Onion Mask ', ingredients: '1 egg, 1 tbsp onion juice, 1 tbsp olive oil.', procedure: 'Whisk egg, mix with onion and oil.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];

const hairCurlyDamagedRemedies = [
    { name: 'Shikakai-Aloe Wash ', ingredients: '1 tbsp shikakai powder, 2 tbsp aloe vera gel, 1 cup water.', procedure: 'Blend all ingredients, strain.', usage: 'Massage into curls, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Hibiscus-Reetha  Shampoo', ingredients: '5 hibiscus flowers, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, blend with hibiscus, boil, strain.', usage: 'Apply to curls, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Coconut Milk Wash ', ingredients: '½ cup coconut milk, ½ cup water.', procedure: 'Dilute coconut milk with water.', usage: 'Massage into curls, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Shea Butter-Avocado Mix ', ingredients: '1 tbsp shea butter, ½ avocado, 1 tbsp coconut milk.', procedure: 'Melt shea butter, mash avocado, mix with milk.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Yogurt Blend ', ingredients: '1 ripe banana, 3 tbsp yogurt, 1 tsp honey.', procedure: 'Mash banana, mix with yogurt and honey.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Aloe Conditioner ', ingredients: '3 tbsp coconut milk, 1 tbsp aloe vera gel, 1 tsp olive oil.', procedure: 'Mix all ingredients.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Argan-Coconut Oil ', ingredients: '1 tbsp argan oil, 1 tbsp coconut oil, 2 drops lavender oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into curls, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Castor-Sesame Oil ', ingredients: '1 tbsp castor oil, 1 tbsp sesame oil.', procedure: 'Combine and warm.', usage: 'Apply to curls, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Amla-Olive Oil ', ingredients: '2 tbsp amla oil, 1 tbsp olive oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Egg-Coconut Milk Mask ', ingredients: '1 egg, 3 tbsp coconut milk, 1 tbsp honey.', procedure: 'Whisk egg, mix with milk and honey.', usage: 'Apply to curls, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Avocado Mask ', ingredients: '5 hibiscus flowers, ½ avocado, 1 tbsp curd.', procedure: 'Blend flowers and avocado, mix with curd.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Shea Butter-Yogurt Mask ', ingredients: '1 tbsp shea butter, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Melt shea butter, mix with yogurt and oil.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCurlyDandruffRemedies = [
    { name: 'Neem-Tea Tree Wash ', ingredients: '10 neem leaves, 3 drops tea tree oil, 1 cup water.', procedure: 'Blend neem with water, strain, add tea tree oil.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Fenugreek-Reetha  Shampoo', ingredients: '2 tbsp fenugreek seeds, 5 reetha nuts, 2 cups water.', procedure: 'Soak fenugreek and reetha overnight, boil, strain.', usage: 'Apply to scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Lemon-Shikakai Wash ', ingredients: '1 tbsp shikakai powder, 1 tsp lemon juice, 1 cup water.', procedure: 'Mix powder with water, add lemon.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Yogurt-Neem Blend ', ingredients: '3 tbsp yogurt, 1 tbsp neem powder, 1 tsp lemon juice.', procedure: 'Mix into a smooth paste.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Aloe Vera-Tea Tree Mix ', ingredients: '2 tbsp aloe vera gel, 3 drops tea tree oil, 1 tsp curd.', procedure: 'Blend all ingredients.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Mint-Lemon Conditioner ', ingredients: '10 mint leaves, 1 tsp lemon juice, 2 tbsp yogurt.', procedure: 'Blend mint with yogurt, add lemon.', usage: 'Apply to scalp, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Tea Tree-Coconut Oil ', ingredients: '2 tbsp coconut oil, 3 drops tea tree oil.', procedure: 'Mix and warm slightly.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Neem-Sesame Oil ', ingredients: '1 tbsp neem oil, 1 tbsp sesame oil.', procedure: 'Mix oils, warm gently.', usage: 'Apply to scalp, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Lemon-Almond Oil ', ingredients: '2 tbsp almond oil, 1 tsp lemon juice.', procedure: 'Mix gently, warm.', usage: 'Massage into scalp, leave 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Curd-Tea Tree Mask ', ingredients: '3 tbsp curd, 3 drops tea tree oil, 1 tsp honey.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Fenugreek-Neem Mask ', ingredients: '2 tbsp fenugreek powder, 1 tbsp neem powder, 2 tbsp curd.', procedure: 'Soak fenugreek in curd overnight, add neem.', usage: 'Apply to scalp, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Lemon-Yogurt Mask ', ingredients: '3 tbsp yogurt, 1 tbsp lemon juice, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients.', usage: 'Apply to scalp, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCurlyDryRemedies = [
    { name: 'Hibiscus-Coconut Wash ', ingredients: '5 hibiscus flowers, ½ cup coconut milk, ½ cup water.', procedure: 'Blend flowers with milk and water, strain.', usage: 'Massage into curls, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Reetha-Aloe  Shampoo', ingredients: '5 reetha nuts, 1 tbsp aloe vera gel, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, add aloe.', usage: 'Apply to curls, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Shikakai-Shea Wash ', ingredients: '1 tbsp shikakai powder, 1 tsp shea butter, 1 cup water.', procedure: 'Mix powder with water, melt shea butter, combine.', usage: 'Massage into curls, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Shea Butter-Coconut Mix ', ingredients: '1 tbsp shea butter, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Melt shea butter, mix with milk and honey.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Avocado-Yogurt Blend ', ingredients: '½ avocado, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mash avocado, mix with yogurt and oil.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Aloe Conditioner ', ingredients: '1 ripe banana, 2 tbsp aloe vera gel, 1 tsp almond oil.', procedure: 'Mash banana, blend with aloe and oil.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut-Sesame Oil ', ingredients: '2 tbsp coconut oil, 1 tbsp sesame oil, 2 drops rosemary oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into curls, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Argan-Olive Oil ', ingredients: '1 tbsp argan oil, 1 tbsp olive oil.', procedure: 'Combine and warm.', usage: 'Apply to curls, leave 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Castor-Almond Oil ', ingredients: '1 tbsp castor oil, 1 tbsp almond oil.', procedure: 'Mix and warm gently.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut Milk-Honey Mask ', ingredients: '3 tbsp coconut milk, 2 tbsp honey, 1 tsp olive oil.', procedure: 'Mix all ingredients.', usage: 'Apply to curls, leave 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Avocado-Egg Mask ', ingredients: '½ avocado, 1 egg, 1 tbsp curd.', procedure: 'Mash avocado, whisk egg, mix with curd.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Shea Mask ', ingredients: '5 hibiscus flowers, 1 tbsp shea butter, 1 tbsp coconut milk.', procedure: 'Blend flowers, melt shea butter, mix with milk.', usage: 'Apply to curls, leave 30 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCurlyNormalRemedies = [
    { name: 'Hibiscus-Shikakai Wash ', ingredients: '5 hibiscus flowers, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend flowers with shikakai and water, strain.', usage: 'Massage into curls, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Rose-Amla  Shampoo', ingredients: '10 rose petals, 1 tbsp amla powder, 1 cup water.', procedure: 'Boil petals and amla, strain.', usage: 'Apply to curls, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha Wash ', ingredients: '5 reetha nuts, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain.', usage: 'Massage into curls, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Rose Mix ', ingredients: '2 tbsp aloe vera gel, 1 tbsp rose water, 1 tsp honey.', procedure: 'Blend all ingredients.', usage: 'Apply post-cleansing, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Yogurt Blend ', ingredients: '2 tbsp coconut milk, 2 tbsp yogurt, 1 tsp almond oil.', procedure: 'Mix all ingredients.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Hibiscus-Curd Conditioner ', ingredients: '5 hibiscus flowers, 3 tbsp curd, 1 tsp lemon juice.', procedure: 'Blend flowers, mix with curd and lemon.', usage: 'Apply to curls, leave 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Almond Oil ', ingredients: '2 tbsp almond oil, 2 drops lavender oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into scalp, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Brahmi-Coconut Oil ', ingredients: '1 tbsp brahmi oil, 1 tbsp coconut oil.', procedure: 'Mix and warm gently.', usage: 'Apply to curls, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Sesame Oil ', ingredients: '2 tbsp sesame oil, 1 tsp rose water.', procedure: 'Mix together.', usage: 'Massage into curls, leave 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Hibiscus-Coconut Mask ', ingredients: '5 hibiscus flowers, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Blend flowers, mix with milk and honey.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Amla-Yogurt Mask ', ingredients: '1 tbsp amla powder, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mix into a paste.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Rose-Curd Mask ', ingredients: '10 rose petals, 3 tbsp curd, 1 tsp aloe vera gel.', procedure: 'Blend petals, mix with curd and aloe.', usage: 'Apply to curls, leave 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCurlyOilyRemedies = [
    { name: 'Multani Mitti-Lemon Wash  ', ingredients: '2 tbsp multani mitti (fuller’s earth), 1 tsp lemon juice, ½ cup water.', procedure: 'Mix multani mitti with water and lemon juice to form a thin paste.', usage: 'Apply to scalp, massage gently for 5 min, rinse with lukewarm water. Use twice weekly.', type: 'Shampoo' },
    { name: 'Mint-Shikakai  Shampoo  ', ingredients: '10 fresh mint leaves, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend mint leaves with water, mix with shikakai powder to form a liquid.', usage: 'Massage into scalp and curls, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha-Lemon Wash  ', ingredients: '5 reetha (soapnut) nuts, 1 tsp lemon juice, 2 cups water.', procedure: 'Soak reetha nuts in water overnight, boil until frothy, strain, add lemon juice.', usage: 'Apply to scalp and hair, massage, rinse thoroughly. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Mint Mix  ', ingredients: '2 tbsp aloe vera gel, 10 fresh mint leaves, 1 tsp lemon juice.', procedure: 'Blend mint leaves with aloe vera gel, add lemon juice, mix well.', usage: 'Apply to curls post-cleansing, focusing on scalp, leave for 10 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Lemon Blend  ', ingredients: '3 tbsp plain yogurt, 1 tsp lemon juice, 1 tsp rose water.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to scalp and curls, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Green Tea-Aloe Conditioner  ', ingredients: '1 tbsp brewed green tea (cooled), 2 tbsp aloe vera gel, 1 tsp honey.', procedure: 'Brew green tea, cool, mix with aloe vera and honey.', usage: 'Apply to curls post-cleansing, leave for 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Jojoba-Tea Tree Oil  ', ingredients: '2 tbsp jojoba oil, 3 drops tea tree essential oil.', procedure: 'Mix oils in a small bowl.', usage: 'Lightly massage into scalp, leave for 30 min, cleanse thoroughly. Use weekly.', type: 'Oil' },
    { name: 'Grapeseed Oil Blend  ', ingredients: '2 tbsp grapeseed oil, 1 tsp lemon extract.', procedure: 'Combine grapeseed oil with lemon extract.', usage: 'Apply sparingly to scalp, leave for 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut-Lemon Oil  ', ingredients: '1 tbsp coconut oil, 1 tsp lemon juice.', procedure: 'Mix coconut oil with lemon juice, warm slightly.', usage: 'Massage into scalp, leave for 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Multani Mitti-Yogurt Mask  ', ingredients: '2 tbsp multani mitti, 2 tbsp yogurt, 1 tsp lemon juice.', procedure: '2 tbsp multani mitti, 2 tbsp yogurt, 1 tsp lemon juice.', usage: 'Apply to scalp, leave for 20 min, rinse with lukewarm water, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Mint-Lemon Mask  ', ingredients: '10 fresh mint leaves, 1 tbsp lemon juice, 2 tbsp curd.', procedure: 'Blend mint leaves with curd, add lemon juice.', usage: 'Apply to scalp and curls, leave for 15 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Bentonite Clay-Rose Mask  ', ingredients: '2 tbsp bentonite clay, 1 tbsp rose water, 1 tsp aloe vera gel.', procedure: 'Mix clay with rose water and aloe vera to form a paste.', usage: 'Apply to scalp, leave for 20 min, rinse thoroughly. Use weekly.', type: 'Mask' },
];
const hairCurlyThinningRemedies = [
    { name: 'Fenugreek-Amla Wash  ', ingredients: '2 tbsp fenugreek seeds, 1 tbsp amla powder, 1 cup water.', procedure: 'Soak fenugreek seeds overnight, boil with amla powder, strain.', usage: 'Massage into scalp and curls, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Reetha  Shampoo  ', ingredients: '1 tbsp brahmi powder, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha nuts overnight, boil with brahmi powder, strain.', usage: 'Apply to scalp, massage, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Onion-Shikakai Wash  ', ingredients: '1 tbsp onion juice, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Mix onion juice with shikakai powder and water.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Aloe Mix  ', ingredients: '1 tbsp brahmi powder, 2 tbsp aloe vera gel, 1 tsp curd.', procedure: 'Mix brahmi powder with aloe vera and curd into a smooth paste.', usage: 'Apply to scalp and curls, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Fenugreek-Yogurt Blend  ', ingredients: '1 tbsp fenugreek paste (soak seeds overnight, blend), 3 tbsp yogurt, 1 tsp honey.', procedure: 'Blend fenugreek paste with yogurt, add honey.', usage: 'Apply to scalp, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Onion-Coconut Conditioner  ', ingredients: '1 tbsp onion juice, 2 tbsp coconut milk, 1 tsp olive oil.', procedure: 'Mix all ingredients thoroughly.', usage: 'Apply to scalp and curls, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Bhringraj-Castor Oil  ', ingredients: '2 tbsp bhringraj oil, 1 tbsp castor oil.', procedure: 'Mix oils, warm gently in a double boiler.', usage: 'Massage into scalp, leave for 1 hr or overnight, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Rosemary-Coconut Oil  ', ingredients: '2 tbsp coconut oil, 3 drops rosemary essential oil.', procedure: 'Mix coconut oil with rosemary oil, warm slightly.', usage: 'Apply to scalp, massage, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Amla-Fenugreek Oil  ', ingredients: '2 tbsp amla oil, 1 tbsp fenugreek oil.', procedure: 'Combine oils, warm gently.', usage: 'Massage into scalp, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Onion-Fenugreek Mask  ', ingredients: '2 tbsp onion juice, 2 tbsp fenugreek powder, 1 tbsp curd.', procedure: 'Mix onion juice with fenugreek powder and curd to form a paste.', usage: 'Apply to scalp, leave for 30 min, rinse with lukewarm water, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Brahmi-Amla Mask  ', ingredients: '1 tbsp brahmi powder, 1 tbsp amla powder, 2 tbsp yogurt.', procedure: 'Mix powders with yogurt into a smooth paste.', usage: 'Apply to scalp and curls, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Egg-Onion Mask  ', ingredients: '1 egg, 1 tbsp onion juice, 1 tbsp olive oil.', procedure: 'Whisk egg, mix with onion juice and olive oil.', usage: 'Apply to scalp, leave for 20 min, rinse with cool water, cleanse. Use weekly.', type: 'Mask' },
];

const hairCoilyDamagedRemedies = [
    { name: 'Shikakai-Aloe Wash  ', ingredients: '1 tbsp shikakai powder, 2 tbsp aloe vera gel, 1 cup water.', procedure: 'Blend shikakai, aloe vera, and water, strain to get a liquid.', usage: 'Massage into coily hair, focusing on scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Hibiscus-Coconut  Shampoo  ', ingredients: '5 hibiscus flowers, ½ cup coconut milk, ½ cup water.', procedure: 'Blend hibiscus flowers with coconut milk and water, strain.', usage: 'Apply to scalp and coils, massage, rinse thoroughly. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha-Shea Wash  ', ingredients: '5 reetha nuts, 1 tsp shea butter, 2 cups water.', procedure: 'Soak reetha overnight, boil, strain, melt shea butter and mix in.', usage: 'Massage into scalp and hair, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Shea Butter-Avocado Mix  ', ingredients: '1 tbsp shea butter, ½ avocado, 1 tbsp coconut milk.', procedure: 'Melt shea butter, mash avocado, mix with coconut milk.', usage: 'Apply to coils post-cleansing, focusing on ends, leave for 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Coconut Conditioner  ', ingredients: '1 ripe banana, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Mash banana, blend with coconut milk and honey.', usage: 'Apply to coils, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Olive Oil Blend  ', ingredients: '3 tbsp yogurt, 1 tbsp olive oil, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to coils, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Argan-Castor Oil  ', ingredients: '1 tbsp argan oil, 1 tbsp castor oil, 2 drops lavender essential oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut-Shea Oil  ', ingredients: '2 tbsp coconut oil, 1 tsp shea butter.', procedure: 'Melt shea butter, mix with coconut oil, warm gently.', usage: 'Apply to scalp and hair, leave for 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Amla-Olive Oil  ', ingredients: '2 tbsp amla oil, 1 tbsp olive oil.', procedure: 'Combine oils, warm gently.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Egg-Coconut Milk Mask  ', ingredients: '1 egg, 3 tbsp coconut milk, 1 tbsp honey.', procedure: 'Whisk egg, mix with coconut milk and honey.', usage: 'Apply to coils, cover with a shower cap, leave for 30 min, rinse, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Shea Mask  ', ingredients: '5 hibiscus flowers, 1 tbsp shea butter, 1 tbsp curd.', procedure: 'Blend hibiscus flowers, melt shea butter, mix with curd.', usage: 'Apply to coils, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Avocado-Yogurt Mask  ', ingredients: '½ avocado, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mash avocado, mix with yogurt and olive oil.', usage: 'Apply to coils, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCoilyDandruffRemedies = [
    { name: 'Neem-Tea Tree Wash  ', ingredients: '10 fresh neem leaves, 3 drops tea tree essential oil, 1 cup water.', procedure: 'Blend neem leaves with water, strain, add tea tree oil.', usage: 'Massage into scalp, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Fenugreek-Reetha  Shampoo  ', ingredients: '2 tbsp fenugreek seeds, 5 reetha nuts, 2 cups water.', procedure: 'Soak fenugreek and reetha overnight, boil, strain.', usage: 'Apply to scalp, massage, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Lemon-Shikakai Wash  ', ingredients: '1 tbsp shikakai powder, 1 tsp lemon juice, 1 cup water.', procedure: 'Mix shikakai powder with water, add lemon juice.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Yogurt-Neem Blend  ', ingredients: '3 tbsp yogurt, 1 tbsp neem powder, 1 tsp lemon juice.', procedure: 'Mix ingredients into a smooth paste.', usage: 'Apply to scalp and coils, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Aloe Vera-Tea Tree Mix  ', ingredients: '2 tbsp aloe vera gel, 3 drops tea tree oil, 1 tsp curd.', procedure: 'Blend aloe vera with curd, add tea tree oil.', usage: 'Apply to scalp, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Mint-Lemon Conditioner', ingredients: '10 fresh mint leaves, 1 tsp lemon juice, 2 tbsp yogurt.', procedure: 'Blend mint leaves with yogurt, add lemon juice.', usage: 'Apply to scalp, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Tea Tree-Coconut Oil  ', ingredients: '2 tbsp coconut oil, 3 drops tea tree essential oil.', procedure: 'Mix coconut oil with tea tree oil, warm slightly.', usage: 'Massage into scalp, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Neem-Sesame Oil  ', ingredients: '1 tbsp neem oil, 1 tbsp sesame oil.', procedure: 'Mix oils, warm gently.', usage: 'Apply to scalp, leave for 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Lemon-Almond Oil  ', ingredients: '2 tbsp almond oil, 1 tsp lemon juice.', procedure: 'Mix almond oil with lemon juice, warm gently.', usage: 'Massage into scalp, leave for 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Curd-Tea Tree Mask  ', ingredients: '3 tbsp curd, 3 drops tea tree oil, 1 tsp honey.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to scalp, leave for 20 min, rinse with lukewarm water, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Fenugreek-Neem Mask  ', ingredients: '2 tbsp fenugreek powder, 1 tbsp neem powder, 2 tbsp curd.', procedure: 'Soak fenugreek powder in curd overnight, add neem powder.', usage: 'Apply to scalp, leave for 30 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Lemon-Yogurt Mask  ', ingredients: '3 tbsp yogurt, 1 tbsp lemon juice, 1 tsp aloe vera gel.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to scalp, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCoilyDryRemedies = [
    { name: 'Hibiscus-Coconut Wash  ', ingredients: '5 hibiscus flowers, ½ cup coconut milk, ½ cup water.', procedure: 'Blend hibiscus flowers with coconut milk and water, strain.', usage: 'Massage into coils, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Reetha-Aloe  Shampoo  ', ingredients: '5 reetha nuts, 1 tbsp aloe vera gel, 2 cups water.', procedure: 'Soak reetha nuts overnight, boil, strain, add aloe vera gel.', usage: 'Apply to scalp and coils, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Shikakai-Shea Wash  ', ingredients: '1 tbsp shikakai powder, 1 tsp shea butter, 1 cup water.', procedure: 'Mix shikakai powder with water, melt shea butter, combine.', usage: 'Massage into scalp and coils, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Shea Butter-Coconut Mix  ', ingredients: '1 tbsp shea butter, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Melt shea butter, mix with coconut milk and honey.', usage: 'Apply to coils, focusing on ends, leave for 20 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Avocado-Yogurt Blend  ', ingredients: '½ avocado, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mash avocado, mix with yogurt and olive oil.', usage: 'Apply to coils, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Banana-Aloe Conditioner  ', ingredients: '1 ripe banana, 2 tbsp aloe vera gel, 1 tsp almond oil.', procedure: 'Mash banana, blend with aloe vera gel and almond oil.', usage: 'Apply to coils, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut-Sesame Oil  ', ingredients: '2 tbsp coconut oil, 1 tbsp sesame oil, 2 drops rosemary essential oil.', procedure: 'Mix oils, warm slightly in a double boiler.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Argan-Olive Oil  ', ingredients: '1 tbsp argan oil, 1 tbsp olive oil.', procedure: 'Combine oils, warm gently.', usage: 'Apply to coils, leave for 1 hr, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Castor-Shea Oil  ', ingredients: '1 tbsp castor oil, 1 tsp shea butter.', procedure: 'Melt shea butter, mix with castor oil, warm gently.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut Milk-Honey Mask  ', ingredients: '3 tbsp coconut milk, 2 tbsp honey, 1 tsp olive oil.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to coils, cover with a shower cap, leave for 30 min, rinse, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Avocado-Egg Mask  ', ingredients: '½ avocado, 1 egg, 1 tbsp curd.', procedure: 'Mash avocado, whisk egg, mix with curd.', usage: 'Apply to coils, leave for 20 min, rinse with cool water. Use weekly.', type: 'Mask' },
    { name: 'Hibiscus-Shea Mask  ', ingredients: '5 hibiscus flowers, 1 tbsp shea butter, 1 tbsp coconut milk.', procedure: 'Blend hibiscus flowers, melt shea butter, mix with coconut milk.', usage: 'Apply to coils, leave for 30 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCoilyNormalRemedies = [
    { name: 'Hibiscus-Shikakai Wash  ', ingredients: '5 hibiscus flowers, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend hibiscus flowers with shikakai powder and water, strain.', usage: 'Massage into scalp and coils, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Rose-Amla  Shampoo  ', ingredients: '10 fresh rose petals, 1 tbsp amla powder, 1 cup water.', procedure: 'Boil rose petals with amla powder in water, strain.', usage: 'Apply to scalp and coils, massage, rinse. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha-Coconut Wash  ', ingredients: '5 reetha nuts, ½ cup coconut milk, 1 cup water.', procedure: 'Soak reetha nuts overnight, boil, strain, mix with coconut milk.', usage: 'Massage into scalp and coils, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Rose Mix  ', ingredients: '2 tbsp aloe vera gel, 1 tbsp rose water, 1 tsp honey.', procedure: 'Blend aloe vera with rose water and honey.', usage: 'Apply to coils post-cleansing, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Coconut Milk-Yogurt Blend  ', ingredients: '2 tbsp coconut milk, 2 tbsp yogurt, 1 tsp almond oil.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to coils, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Hibiscus-Curd Conditioner  ', ingredients: '5 hibiscus flowers, 3 tbsp curd, 1 tsp lemon juice.', procedure: 'Blend hibiscus flowers, mix with curd and lemon juice.', usage: 'Apply to coils, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Almond-Coconut Oil  ', ingredients: '2 tbsp almond oil, 1 tbsp coconut oil, 2 drops lavender essential oil.', procedure: 'Mix oils, warm slightly.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Brahmi-Sesame Oil  ', ingredients: '1 tbsp brahmi oil, 1 tbsp sesame oil.', procedure: 'Mix oils, warm gently.', usage: 'Apply to scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Shea-Coconut Oil  ', ingredients: '1 tsp shea butter, 2 tbsp coconut oil.', procedure: 'Melt shea butter, mix with coconut oil, warm gently.', usage: 'Massage into scalp and coils, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Hibiscus-Coconut Mask  ', ingredients: '5 hibiscus flowers, 2 tbsp coconut milk, 1 tsp honey.', procedure: 'Blend hibiscus flowers, mix with coconut milk and honey.', usage: 'Apply to coils, leave for 20 min, rinse with lukewarm water. Use weekly.', type: 'Mask' },
    { name: 'Amla-Yogurt Mask  ', ingredients: '1 tbsp amla powder, 3 tbsp yogurt, 1 tsp olive oil.', procedure: 'Mix amla powder with yogurt and olive oil into a paste.', usage: 'Apply to coils, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Rose-Curd Mask  ', ingredients: '10 fresh rose petals, 3 tbsp curd, 1 tsp aloe vera gel.', procedure: 'Blend rose petals, mix with curd and aloe vera gel.', usage: 'Apply to coils, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
];
const hairCoilyOilyRemedies = [
    { name: 'Multani Mitti-Lemon Wash  ', ingredients: '2 tbsp multani mitti, 1 tsp lemon juice, ½ cup water.', procedure: 'Mix multani mitti with water and lemon juice to form a thin paste.', usage: 'Apply to scalp, massage gently, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Mint-Shikakai  Shampoo  ', ingredients: '10 fresh mint leaves, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Blend mint leaves with water, mix with shikakai powder.', usage: 'Massage into scalp and coils, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Reetha-Lemon Wash  ', ingredients: '5 reetha nuts, 1 tsp lemon juice, 2 cups water.', procedure: 'Soak reetha nuts overnight, boil until frothy, strain, add lemon juice.', usage: 'Apply to scalp and coils, massage, rinse thoroughly. Use weekly.', type: 'Shampoo' },
    { name: 'Aloe Vera-Mint Mix  ', ingredients: '2 tbsp aloe vera gel, 10 fresh mint leaves, 1 tsp lemon juice.', procedure: 'Blend mint leaves with aloe vera gel, add lemon juice.', usage: 'Apply to scalp and coils post-cleansing, leave for 10 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Yogurt-Lemon Blend  ', ingredients: '3 tbsp yogurt, 1 tsp lemon juice, 1 tsp rose water.', procedure: 'Mix all ingredients into a smooth paste.', usage: 'Apply to scalp, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Green Tea-Aloe Conditioner  ', ingredients: '1 tbsp brewed green tea (cooled), 2 tbsp aloe vera gel, 1 tsp honey.', procedure: 'Brew green tea, cool, mix with aloe vera and honey.', usage: 'Apply to coils, leave for 10 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Jojoba-Tea Tree Oil  ', ingredients: '2 tbsp jojoba oil, 3 drops tea tree essential oil.', procedure: 'Mix oils in a small bowl.', usage: 'Lightly massage into scalp, leave for 30 min, cleanse thoroughly. Use weekly.', type: 'Oil' },
    { name: 'Grapeseed Oil Blend  ', ingredients: '2 tbsp grapeseed oil, 1 tsp lemon extract.', procedure: 'Combine grapeseed oil with lemon extract.', usage: 'Apply sparingly to scalp, leave for 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Coconut-Lemon Oil  ', ingredients: '1 tbsp coconut oil, 1 tsp lemon juice.', procedure: 'Mix coconut oil with lemon juice, warm slightly.', usage: 'Massage into scalp, leave for 30 min, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Multani Mitti-Yogurt Mask  ', ingredients: '2 tbsp multani mitti, 2 tbsp yogurt, 1 tsp lemon juice.', procedure: 'Mix ingredients into a smooth paste.', usage: 'Apply to scalp, leave for 20 min, rinse with lukewarm water, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Mint-Lemon Mask  ', ingredients: '10 fresh mint leaves, 1 tbsp lemon juice, 2 tbsp curd.', procedure: 'Blend mint leaves with curd, add lemon juice.', usage: 'Apply to scalp and coils, leave for 15 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Clay-Rose Mask  ', ingredients: '2 tbsp bentonite clay, 1 tbsp rose water, 1 tsp aloe vera gel.', procedure: 'Mix clay with rose water and aloe vera to form a paste.', usage: 'Apply to scalp, leave for 20 min, rinse thoroughly. Use weekly.', type: 'Mask' },
];
const hairCoilyThinningRemedies = [
    { name: 'Fenugreek-Amla Wash  ', ingredients: '2 tbsp fenugreek seeds, 1 tbsp amla powder, 1 cup water.', procedure: 'Soak fenugreek seeds overnight, boil with amla powder, strain.', usage: 'Massage into scalp and coils, rinse after 5 min. Use twice weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Reetha  Shampoo  ', ingredients: '1 tbsp brahmi powder, 5 reetha nuts, 2 cups water.', procedure: 'Soak reetha nuts overnight, boil with brahmi powder, strain.', usage: 'Apply to scalp, massage, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Onion-Shikakai Wash  ', ingredients: '1 tbsp onion juice, 1 tbsp shikakai powder, 1 cup water.', procedure: 'Mix onion juice with shikakai powder and water.', usage: 'Massage into scalp, rinse after 5 min. Use weekly.', type: 'Shampoo' },
    { name: 'Brahmi-Aloe Mix  ', ingredients: '1 tbsp brahmi powder, 2 tbsp aloe vera gel, 1 tsp curd.', procedure: 'Mix brahmi powder with aloe vera and curd into a smooth paste.', usage: 'Apply to scalp and coils, leave for 15 min, rinse with cool water. Use weekly.', type: 'Conditioner' },
    { name: 'Fenugreek-Yogurt Blend  ', ingredients: '1 tbsp fenugreek paste (soak seeds overnight, blend), 3 tbsp yogurt, 1 tsp honey.', procedure: 'Blend fenugreek paste with yogurt, add honey.', usage: 'Apply to scalp, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Onion-Coconut Conditioner  ', ingredients: '1 tbsp onion juice, 2 tbsp coconut milk, 1 tsp olive oil.', procedure: 'Mix all ingredients thoroughly.', usage: 'Apply to scalp and coils, leave for 15 min, rinse. Use weekly.', type: 'Conditioner' },
    { name: 'Bhringraj-Castor Oil  ', ingredients: '2 tbsp bhringraj oil, 1 tbsp castor oil.', procedure: 'Mix oils, warm gently in a double boiler.', usage: 'Massage into scalp, leave for 1 hr or overnight, cleanse. Use twice weekly.', type: 'Oil' },
    { name: 'Rosemary-Coconut Oil  ', ingredients: '2 tbsp coconut oil, 3 drops rosemary essential oil.', procedure: 'Mix coconut oil with rosemary oil, warm slightly.', usage: 'Apply to scalp, massage, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Amla-Fenugreek Oil  ', ingredients: '2 tbsp amla oil, 1 tbsp fenugreek oil.', procedure: 'Combine oils, warm gently.', usage: 'Massage into scalp, leave for 1 hr, cleanse. Use weekly.', type: 'Oil' },
    { name: 'Onion-Fenugreek Mask  ', ingredients: '2 tbsp onion juice, 2 tbsp fenugreek powder, 1 tbsp curd.', procedure: 'Mix onion juice with fenugreek powder and curd to form a paste.', usage: 'Apply to scalp, leave for 30 min, rinse with lukewarm water, cleanse. Use weekly.', type: 'Mask' },
    { name: 'Brahmi-Amla Mask  ', ingredients: '1 tbsp brahmi powder, 1 tbsp amla powder, 2 tbsp yogurt.', procedure: 'Mix powders with yogurt into a smooth paste.', usage: 'Apply to scalp and coils, leave for 20 min, rinse. Use weekly.', type: 'Mask' },
    { name: 'Egg-Onion Mask  ', ingredients: '1 egg, 1 tbsp onion juice, 1 tbsp olive oil.', procedure: 'Whisk egg, mix with onion juice and olive oil.', usage: 'Apply to scalp, leave for 20 min, rinse with cool water, cleanse. Use weekly.', type: 'Mask' },
];

// Skin Commercial Products (Distinct for Each Type-Problem Combination)
const skinOilyAcneProducts = [
    { name: 'Minimalist Anti-Acne Salicylic Acid 2% Face Wash', price: 299, image: 'Minimalist_Anti-Acne_Salicylic_Acid_2%_Face_Wash.jpeg', type: 'Cleanser' },
    { name: 'Cetaphil Oily Skin Cleanser', price: 299, image: 'Cetaphil_Oily_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Plum Green Tea Pore Cleansing Face Wash', price: 242, image: 'Plum_Green_Tea_Pore_Cleansing_Face_Wash.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cream to Foam Moisturizer', price: 600, image: 'CeraVe_Hydrating_Cream_to_Foam_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors+HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Mattifying Moisturizer', price: 300, image: 'Plum_Green_Tea_Mattifying_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios UVmune 400', price: 600, image: 'La_Roche-Posay_Anthelios_UVmune_400.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Garnier Light Complete Vitamin C Sunscreen', price: 300, image: 'Garnier_Light_Complete_Vitamin_C_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinOilyAgingProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 965, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar _Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Hydrating Moisturizer', price: 300, image: 'Plum_Green_Tea_Hydrating_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinOilyDrynessProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 965, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar _Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Hydrating Moisturizer', price: 300, image: 'Plum_Green_Tea_Hydrating_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinOilyNormalProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 965, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar _Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Hydrating Moisturizer', price: 300, image: 'Plum_Green_Tea_Hydrating_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinOilyPigmentationProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 965, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar _Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Hydrating Moisturizer', price: 300, image: 'Plum_Green_Tea_Hydrating_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinOilyRednessProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 965, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar _Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Hydrating Moisturizer', price: 300, image: 'Plum_Green_Tea_Hydrating_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];

const skinDryAcneProducts = [
    { name: 'Dermalogica Special Cleansing Gel ', price: 3000, image: 'Dermalogica_Special_Cleansing_Gel_.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Daily Facial Cleanser ', price: 699, image: '_Cetaphil_Daily_Facial_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Drunk Elephant Lala Retro Whipped Cream ', price: 2800, image: '_Drunk_Elephant_Lala_Retro_Whipped_Cream_.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel ', price: 950, image: 'Neutrogena_Hydro_Boost_Water_Gel_.jpg', type: 'Moisturizer' },
    { name: 'POND’S Super Light Gel ', price: 299, image: '_POND’S_Super_Light_Gel_.jpg', type: 'Moisturizer' },
    { name: 'Supergoop Unseen Sunscreen SPF 40 ', price: 2720, image: 'Supergoop_Unseen_Sunscreen_SPF_40.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios Clear Skin SPF 60 ', price: 2399, image: 'La_Roche-Posay_Anthelios_Clear_Skin_SPF_60.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinDryAgingProducts = [
    { name: 'Dr. Dennis Gross Alpha Beta Pore Perfecting Cleanser ', price: 1300, image: 'Dr._Dennis_Gross_Alpha_Beta_Pore_Perfecting_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Olay Regenerist Revitalizing Cream Cleanser ', price: 899, image: 'Olay_Regenerist_Revitalizing_Cream_Cleanser.jpg', type: 'Cleanser' },
    { name: 'L’Oréal Revitalift Bright Reveal Cleanser ', price: 599, image: 'L’Oréal_Revitalift_Bright_Reveal_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Estée Lauder Revitalizing Supreme+ Global Anti-Aging Cream ', price: 2400, image: 'Estée_Lauder_Revitalizing_Supreme+_Global_Anti-Aging_Cream.jpg', type: 'Moisturizer' },
    { name: 'Olay Regenerist Micro-Sculpting Cream ', price: 1899, image: 'Olay_Regenerist_Micro-Sculpting_Cream.jpg', type: 'Moisturizer' },
    { name: 'L’Oréal Paris Revitalift Moisturizing Cream ', price: 650, image: 'L’Oréal_Paris_Revitalift_Moisturizing_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra 100 Active Unify SPF 50 ', price: 2300, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50 ', price: 1399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinDryDrynessProducts = [
    { name: 'Dermalogica Intensive Moisture Cleanser ', price: 2000, image: 'Dermalogica_Intensive_Moisture_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 429, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Belif The True Cream Moisturizing Bomb ', price: 2200, image: '_Belif_The_True_Cream_Moisturizing_Bomb_.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel ', price: 950, image: 'Neutrogena_Hydro_Boost_Water_Gel_.jpg', type: 'Moisturizer' },
    { name: 'POND’S Super Light Gel ', price: 299, image: 'POND’S_Super_Light_Gel_.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Fusion Water SPF 50+ ', price: 2300, image: 'ISDIN_Fusion_Water_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena UltraSheer Dry-Touch SPF 50 ', price: 675, image: 'Neutrogena_UltraSheer_Dry-Touch_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'Aqualogica Radiance+ Dewy Sunscreen ', price: 399, image: 'Aqualogica_Radiance+_Dewy_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinDryNormalProducts = [
    { name: 'Dr. Barbara Sturm Enzyme Cleanser ', price: 1500, image: 'Dr._Barbara_Sturm_Enzyme_Cleanser.jpg', type: 'Cleanser' },
    { name: 'The Face Shop Rice Water Bright Cleanser ', price: 745, image: 'The_Face_Shop_Rice_Water_Bright_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash ', price: 265, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'Clinique Dramatically Different Moisturizing Gel ', price: 1100, image: 'Clinique_Dramatically_Different_Moisturizing_Gel.jpg', type: 'Moisturizer' },
    { name: 'Cetaphil Daily Oil-Free Hydrating Lotion ', price: 850, image: 'Cetaphil_Daily_Oil-Free_Hydrating_Lotion.jpg', type: 'Moisturizer' },
    { name: 'Garnier Bright Complete Vitamin C Serum Cream ', price: 199, image: 'Garnier_Bright_Complete_Vitamin_C_Serum_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra Spot Prevent SPF 50 ', price: 2800, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinDryPigmentationProducts = [
    { name: 'La Roche-Posay Toleriane Dermo-Cleanser ', price: 2199, image: 'La_Roche-Posay_Toleriane_Dermo-Cleanser.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 429, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Pigmentbio Daily Care SPF 50+', price: 1899, image: 'Bioderma_Pigmentbio_Daily_Care_SPF_50+.jpg', type: 'Moisturizer' },
    { name: 'Olay Luminous Tone Perfecting Cream ', price: 1699, image: 'Olay_Luminous_Tone_Perfecting_Cream.jpg', type: 'Moisturizer' },
    { name: 'Garnier Bright Complete Vitamin C Serum Cream ', price: 199, image: 'Garnier_Bright_Complete_Vitamin_C_Serum_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra Spot Prevent SPF 50 ', price: 2800, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinDryRednessProducts = [
    { name: 'La Roche-Posay Toleriane Dermo-Cleanser ', price: 2199, image: 'La_Roche-Posay_Toleriane_Dermo-Cleanser.jpg', type: 'Cleanser' },
    { name: 'Avene Antirougeurs Clean Refreshing Cleansing Lotion ', price: 1190, image: 'Avene_Antirougeurs_Clean_Refreshing_Cleansing_Lotion.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio Gel Moussant ', price: 599, image: 'Bioderma_Sensibio_Gel_Moussant.jpg', type: 'Cleanser' },
    { name: 'Avene Antirougeurs Fort Relief Concentrate ', price: 2590, image: 'Avene_Antirougeurs_Fort_Relief_Concentrate.jpg', type: 'Moisturizer' },
    { name: 'Bioderma Sensibio Light Soothing Cream ', price: 1395, image: 'Bioderma_Sensibio_Light_Soothing_Cream.jpg', type: 'Moisturizer' },
    { name: 'Simple Replenishing Rich Moisturizer ', price: 410, image: 'Simple_Replenishing_Rich_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'EltaMD UV Clear Broad-Spectrum SPF 46 ', price: 2895, image: 'EltaMD_UV_Clear_Broad-Spectrum_SPF_46.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Hydro Boost Water Gel Sunscreen SPF 50 ', price: 650, image: 'Neutrogena_Hydro_Boost_Water_Gel_Sunscreen_SPF_50.jpg', type: 'Sunscreen' },
];

const skinNormalAcneProducts = [
    { name: 'Neutrogena Deep Clean Gentle Facial Cleanser', price: 488, image: 'Neutrogena_Deep_Clean_Gentle_Facial_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Clean & Clear Foaming Face Wash', price: 223, image: 'Clean_&_Clear_Foaming_Face_Wash.jpg', type: 'Cleanser' },
    { name: 'PONDS Pure Detox Facewash', price: 209, image: 'PONDS_Pure_Detox_Facewash.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cream to Foam Moisturizer', price: 600, image: 'CeraVe_Hydrating_Cream_to_Foam_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios UVmune 400', price: 600, image: 'La_Roche-Posay_Anthelios_UVmune_400.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Garnier Light Complete Vitamin C Sunscreen', price: 300, image: 'Garnier_Light_Complete_Vitamin_C_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinNormalAgingProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 956, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume_B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_+_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinNormalDrynessProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 956, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume_B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_+_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinNormalNormalProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 956, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume_B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_+_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinNormalPigmentationProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 956, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume_B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_+_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];
const skinNormalRednessProducts = [
    { name: 'Cetaphil Gentle Skin Cleanser', price: 956, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water', price: 400, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash', price: 224, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'La Roche-Posay Cicaplast Baume B5', price: 500, image: 'La_Roche-Posay_Cicaplast_Baume_B5.jpg', type: 'Moisturizer' },
    { name: 'The Ordinary Natural Moisturizing Factors + HA', price: 500, image: 'The_Ordinary_Natural_Moisturizing_Factors_+_HA.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel', price: 400, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios AOX Fluid', price: 600, image: 'La_Roche-Posay_Anthelios_AOX_Fluid.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunscreen', price: 400, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Lotus Herbals Safe Sun UV Screen Gel SPF 50', price: 250, image: 'Lotus_Herbals_Safe_Sun_UV_Screen_Gel_SPF_50.jpg', type: 'Sunscreen' },
];

const skinCombinationAcneProducts = [
    { name: 'Paula’s Choice Clear Pore Normalizing Cleanser', price: 2400, image: 'Paula’s_Choice_Clear_Pore_Normalizing_Cleanser.jpg', type: 'Cleanser' },
    { name: 'CeraVe Foaming Facial Cleanser ', price: 1650, image: 'CeraVe_Foaming_Facial_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Himalaya Purifying Neem Face Wash ', price: 165, image: 'Himalaya_Purifying_Neem_Face_Wash.jpg', type: 'Cleanser' },
    { name: 'Drunk Elephant Protini Polypeptide Cream ', price: 2700, image: 'Drunk_Elephant_Protini_Polypeptide_Cream.jpg', type: 'Moisturizer' },
    { name: 'Minimalist Sepicalm 3% Face Moisturizer ', price: 349, image: 'Minimalist_Sepicalm_3%_Face_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'Plum Green Tea Oil-Free Moisturizer ', price: 470, image: 'Plum_Green_Tea_Oil-Free_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'Supergoop Unseen Sunscreen SPF 40 ', price: 2720, image: 'Supergoop_Unseen_Sunscreen_SPF_40.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios Clear Skin SPF 60 ', price: 2399, image: 'La_Roche-Posay_Anthelios_Clear_Skin_SPF_60.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinCombinationAgingProducts = [
    { name: 'Dr. Dennis Gross Alpha Beta Pore Perfecting Cleanser ', price: 1300, image: 'Dr._Dennis_Gross_Alpha_Beta_Pore_Perfecting_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Olay Regenerist Revitalizing Cream Cleanser ', price: 899, image: 'Olay_Regenerist_Revitalizing_Cream_Cleanser.jpg', type: 'Cleanser' },
    { name: 'L’Oréal Revitalift Bright Reveal Cleanser ', price: 599, image: 'L’Oréal_Revitalift_Bright_Reveal_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Estée Lauder Revitalizing Supreme+ Global Anti-Aging Cream ', price: 2400, image: 'Estée_Lauder_Revitalizing_Supreme+_Global_Anti-Aging_Cream.jpg', type: 'Moisturizer' },
    { name: 'Olay Regenerist Micro-Sculpting Cream ', price: 1899, image: 'Olay_Regenerist_Micro-Sculpting_Cream.jpg', type: 'Moisturizer' },
    { name: 'L’Oréal Paris Revitalift Moisturizing Cream ', price: 650, image: 'L’Oréal_Paris_Revitalift_Moisturizing_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra 100 Active Unify SPF 50 ', price: 2300, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50 ', price: 1399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinCombinationDrynessProducts = [
    { name: 'Dermalogica Intensive Moisture Cleanser ', price: 2000, image: 'Dermalogica_Intensive_Moisture_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 429, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Belif The True Cream Moisturizing Bomb ', price: 2200, image: '_Belif_The_True_Cream_Moisturizing_Bomb_.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel ', price: 950, image: 'Neutrogena_Hydro_Boost_Water_Gel_.jpg', type: 'Moisturizer' },
    { name: 'POND’S Super Light Gel ', price: 299, image: 'POND’S_Super_Light_Gel_.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Fusion Water SPF 50+ ', price: 2300, image: 'ISDIN_Fusion_Water_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena UltraSheer Dry-Touch SPF 50 ', price: 675, image: 'Neutrogena_UltraSheer_Dry-Touch_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'Aqualogica Radiance+ Dewy Sunscreen ', price: 399, image: 'Aqualogica_Radiance+_Dewy_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinCombinationNormalProducts = [
    { name: 'Dr. Barbara Sturm Enzyme Cleanser ', price: 1500, image: 'Dr._Barbara_Sturm_Enzyme_Cleanser.jpg', type: 'Cleanser' },
    { name: 'The Face Shop Rice Water Bright Cleanser ', price: 745, image: 'The_Face_Shop_Rice_Water_Bright_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Refreshing Facial Wash ', price: 265, image: 'Simple_Kind_to_Skin_Refreshing_FacialWash.jpg', type: 'Cleanser' },
    { name: 'Clinique Dramatically Different Moisturizing Gel ', price: 1100, image: 'Clinique_Dramatically_Different_Moisturizing_Gel.jpg', type: 'Moisturizer' },
    { name: 'Cetaphil Daily Oil-Free Hydrating Lotion ', price: 850, image: 'Cetaphil_Daily_Oil-Free_Hydrating_Lotion.jpg', type: 'Moisturizer' },
    { name: 'Garnier Bright Complete Vitamin C Serum Cream ', price: 199, image: 'Garnier_Bright_Complete_Vitamin_C_Serum_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra Spot Prevent SPF 50 ', price: 2800, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinCombinationPigmentationProducts = [
    { name: 'La Roche-Posay Toleriane Dermo-Cleanser ', price: 2199, image: 'La_Roche-Posay_Toleriane_Dermo-Cleanser.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 429, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Pigmentbio Daily Care SPF 50+', price: 1899, image: 'Bioderma_Pigmentbio_Daily_Care_SPF_50+.jpg', type: 'Moisturizer' },
    { name: 'Olay Luminous Tone Perfecting Cream ', price: 1699, image: 'Olay_Luminous_Tone_Perfecting_Cream.jpg', type: 'Moisturizer' },
    { name: 'Garnier Bright Complete Vitamin C Serum Cream ', price: 199, image: 'Garnier_Bright_Complete_Vitamin_C_Serum_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra Spot Prevent SPF 50 ', price: 2800, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinCombinationRednessProducts = [
    { name: 'La Roche-Posay Toleriane Dermo-Cleanser ', price: 2199, image: 'La_Roche-Posay_Toleriane_Dermo-Cleanser.jpg', type: 'Cleanser' },
    { name: 'Avene Antirougeurs Clean Refreshing Cleansing Lotion ', price: 1190, image: 'Avene_Antirougeurs_Clean_Refreshing_Cleansing_Lotion.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio Gel Moussant ', price: 599, image: 'Bioderma_Sensibio_Gel_Moussant.jpg', type: 'Cleanser' },
    { name: 'Avene Antirougeurs Fort Relief Concentrate ', price: 2590, image: 'Avene_Antirougeurs_Fort_Relief_Concentrate.jpg', type: 'Moisturizer' },
    { name: 'Bioderma Sensibio Light Soothing Cream ', price: 1395, image: 'Bioderma_Sensibio_Light_Soothing_Cream.jpg', type: 'Moisturizer' },
    { name: 'Simple Replenishing Rich Moisturizer ', price: 410, image: 'Simple_Replenishing_Rich_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'EltaMD UV Clear Broad-Spectrum SPF 46 ', price: 2895, image: 'EltaMD_UV_Clear_Broad-Spectrum_SPF_46.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Hydro Boost Water Gel Sunscreen SPF 50 ', price: 650, image: 'Neutrogena_Hydro_Boost_Water_Gel_Sunscreen_SPF_50.jpg', type: 'Sunscreen' },
];

const skinSensitiveAcneProducts = [
    { name: 'CeraVe Foaming Cleanser ', price: 1650, image: 'CeraVe_Foaming_Facial_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Oily Skin Cleanser ', price: 650, image: 'Cetaphil_Oily_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Dot & Key Cica Salicylic & Green Tea Facewash ', price: 212, image: 'Dot_&_Key_Cica_Salicylic_&_Green_Tea_Facewash_.jpg', type: 'Cleanser' },
    { name: 'Clinique Moisture Surge 72-Hour Auto-Replenishing Hydrator ', price: 3200, image: 'Clinique_Moisture_Surge_72-Hour_Auto-Replenishing_Hydrator.jpg', type: 'Moisturizer' },
    { name: 'Neutrogena Hydro Boost Water Gel ', price: 950, image: 'Neutrogena_Hydro_Boost_Water_Gel.jpg', type: 'Moisturizer' },
    { name: 'Jovees Aloe Vera Moisturising Lotion ', price: 208, image: 'Jovees_Aloe_Vera_Moisturising_Lotion.jpg', type: 'Moisturizer' },
    { name: 'EltaMD UV Clear Broad-Spectrum SPF 46 ', price: 3000, image: 'EltaMD_UV_Clear_Broad-Spectrum_SPF_46.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 1950, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+ ', price: 675, image: 'Neutrogena_UltraSheer_Dry-Touch_SPF_50.jpg', type: 'Sunscreen' },
];
const skinSensitiveAgingProducts = [
    { name: 'CeraVe Hydrating Cleanser ', price: 1200, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 500, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Moisturizing Facial Wash ', price: 400, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'Olay Regenerist Micro-Sculpting Cream', price: 1999, image: 'Olay_Regenerist_Micro-Sculpting_Cream.jpg', type: 'Moisturizer' },
    { name: 'LOréal Paris Revitalift Moisturizing Cream ', price: 999, image: 'L’Oréal_Paris_Revitalift_Moisturizing_Cream.jpg', type: 'Moisturizer' },
    { name: 'Dot & Key Super Bright Moisturizer', price: 263, image: 'Dot_&_Key_Super_Bright_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 1950, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+ ', price: 675, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Plum Green Tea Day-Light Sunscreen Gel SPF 35 PA+++ ', price: 575, image: 'Plum_Green_Tea_Day-Light_Sunscreen_Gel_SPF_35_PA+++.jpg', type: 'Sunscreen' },
];
const skinSensitiveDrynessProducts = [
    { name: 'Avène Extremely Gentle Cleanser Lotion ', price: 1500, image: 'Avène_Extremely_Gentle_Cleanser_Lotion.jpg', type: 'Cleanser' },
    { name: 'Bioderma Atoderm Intensive Gel Moussant ', price: 1000, image: 'Bioderma_Atoderm_Intensive_Gel_Moussant.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 500, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Clinique Moisture Surge Intense 72H Lipid-Replenishing Hydrator ', price: 3200, image: 'Clinique_Moisture_Surge_72-Hour_Auto-Replenishing_Hydrator.jpg', type: 'Moisturizer' },
    { name: 'Bioderma Atoderm Baume ', price: 1200, image: 'Bioderma_Atoderm_Baume_.jpg', type: 'Moisturizer' },
    { name: 'Dot & Key Super Bright Moisturizer ', price: 263, image: 'Dot_&_Key_Super_Bright_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios Ultra-Light Fluid SPF 50+ ', price: 1950, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+ ', price: 675, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Plum E-Luminence Deep Moisturizing Cream with SPF ', price: 575, image: 'Plum_E-Luminence_Deep_Moisturizing_Cream_with_SPF.jpg', type: 'Sunscreen' },
];
const skinSensitiveNormalProducts = [
    { name: 'CeraVe Hydrating Cleanser ', price: 1200, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 500, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Simple Kind to Skin Moisturizing Facial Wash ', price: 400, image: 'Simple_Kind_to_Skin_Refreshing_Facial_Wash.jpg', type: 'Cleanser' },
    { name: 'Olay Regenerist Micro-Sculpting Cream', price: 1999, image: 'Olay_Regenerist_Micro-Sculpting_Cream.jpg', type: 'Moisturizer' },
    { name: 'LOréal Paris Revitalift Moisturizing Cream ', price: 999, image: 'L’Oréal_Paris_Revitalift_Moisturizing_Cream.jpg', type: 'Moisturizer' },
    { name: 'Dot & Key Super Bright Moisturizer', price: 263, image: 'Dot_&_Key_Super_Bright_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 1950, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+ ', price: 675, image: 'Neutrogena_Ultra_Sheer_Dry-Touch_Sunscreen.jpg', type: 'Sunscreen' },
    { name: 'Plum Green Tea Day-Light Sunscreen Gel SPF 35 PA+++ ', price: 575, image: 'Plum_Green_Tea_Day-Light_Sunscreen_Gel_SPF_35_PA+++.jpg', type: 'Sunscreen' },
];
const skinSensitivePigmentationProducts = [
    { name: 'La Roche-Posay Toleriane Dermo-Cleanser ', price: 2199, image: 'La_Roche-Posay_Toleriane_Dermo-Cleanser.jpg', type: 'Cleanser' },
    { name: 'CeraVe Hydrating Cleanser ', price: 1150, image: 'CeraVe_Hydrating_Cleanser_.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 429, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Bioderma Pigmentbio Daily Care SPF 50+', price: 1899, image: 'Bioderma_Pigmentbio_Daily_Care_SPF_50+.jpg', type: 'Moisturizer' },
    { name: 'Olay Luminous Tone Perfecting Cream ', price: 1699, image: 'Olay_Luminous_Tone_Perfecting_Cream.jpg', type: 'Moisturizer' },
    { name: 'Garnier Bright Complete Vitamin C Serum Cream ', price: 199, image: 'Garnier_Bright_Complete_Vitamin_C_Serum_Cream.jpg', type: 'Moisturizer' },
    { name: 'ISDIN Photo Ultra Spot Prevent SPF 50 ', price: 2800, image: 'ISDIN_Photo_Ultra_Spot_Prevent_SPF_50.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios UVMune 400 SPF 50+ ', price: 2399, image: 'La_Roche-Posay_Anthelios_UVMune_400_SPF_50+.jpg', type: 'Sunscreen' },
    { name: 'Minimalist SPF 50 PA++++ Sunscreen ', price: 399, image: 'Minimalist_SPF_50_PA++++_Sunscreen.jpg', type: 'Sunscreen' },
];
const skinSensitiveRednessProducts = [
    { name: 'Avène Antirougeurs CLEAN Refreshing Cleansing Lotion ', price: 1500, image: 'Avène_Antirougeurs_CLEAN_Refreshing_Cleansing_Lotion.jpg', type: 'Cleanser' },
    { name: 'Bioderma Sensibio H2O Micellar Water ', price: 1000, image: 'Bioderma_Sensibio_H2O_Micellar_Water.jpg', type: 'Cleanser' },
    { name: 'Cetaphil Gentle Skin Cleanser ', price: 500, image: 'Cetaphil_Gentle_Skin_Cleanser.jpg', type: 'Cleanser' },
    { name: 'Olay Regenerist Micro-Sculpting Cream', price: 1999, image: 'Olay_Regenerist_Micro-Sculpting_Cream.jpg', type: 'Moisturizer' },
    { name: 'Bioderma Sensibio AR Cream ', price: 1500, image: 'Bioderma_Sensibio_AR_Cream.jpg', type: 'Moisturizer' },
    { name: 'Dot & Key Super Bright Moisturizer ', price: 263, image: 'Dot_&_Key_Super_Bright_Moisturizer.jpg', type: 'Moisturizer' },
    { name: 'EltaMD UV Clear Broad-Spectrum SPF 46 ', price: 3000, image: 'EltaMD_UV_Clear_Broad-Spectrum_SPF_46.jpg', type: 'Sunscreen' },
    { name: 'La Roche-Posay Anthelios XL SPF 50+ ', price: 1950, image: 'La_Roche-Posay_Rosaliac_AR_Intense_Visible_Redness_Reducing_Serum.jpg', type: 'Sunscreen' },
    { name: 'Neutrogena Ultra Sheer Dry-Touch Sunblock SPF 50+ ', price: 675, image: 'Neutrogena_UltraSheer_Dry-Touch_SPF_50.jpg', type: 'Sunscreen' },
];

// Skin Natural Remedies (Distinct for Each Type-Problem Combination)
const skinOilyAcneRemedies = [
    { name: 'Neem-Tulsi Wash', ingredients: '10 fresh neem leaves, 10 fresh tulsi leaves, 1 cup water.', procedure: 'Boil neem and tulsi leaves in water, cool, strain.', usage: 'Use to wash face, massage gently for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
    { name: 'Multani Mitti Cleanser', ingredients: '1 tbsp multani mitti, 1 tsp lemon juice, 2 tbsp water.', procedure: 'Mix into a thin paste.', usage: 'Apply to face, massage for 1 min, rinse with cool water. Use daily.', type: 'Cleanser' },
    { name: 'Tea Tree-Honey Wash', ingredients: '1 tsp honey , 2 drops tea tree essential oil, 2 tbsp water.', procedure: 'Mix honey with water, add tea tree oil.', usage: 'Massage onto face, rinse after 1 min. Use daily', type: 'Cleanser' },
    { name: 'Green Tea Toner', ingredients: '1 green tea bag, ½ cup hot water, 1 tsp witch hazel.', procedure: 'Steep tea bag in hot water for 10 min, cool, add witch hazel.', usage: 'Apply with a cotton pad post-cleansing, do not rinse. Use twice daily.', type: 'Toner' },
    { name: 'Cucumber-Lemon Toner', ingredients: '½ cucumber, 1 tsp lemon juice, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with lemon juice and water.', usage: 'Dab on face with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Rose Water-Tea Tree Toner', ingredients: '½ cup rose water, 2 drops tea tree essential oil', procedure: 'Mix rose water with tea tree oil, store in a spray bottle.', usage: 'Spritz or apply with a cotton pad post-cleansing. Use twice daily.', type: 'Toner' },
    { name: 'Aloe Vera Gel', ingredients: ' 2 tbsp aloe vera gel, 1 tsp jojoba oil.', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Cucumber-Yogurt Cream', ingredients: ' 2 tbsp cucumber juice, 1 tbsp yogurt.', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Apply lightly to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Grapeseed Oil Blend', ingredients: '1 tsp grapeseed oil, 1 drop tea tree oil.', procedure: 'Mix oils together.', usage: 'Massage a few drops into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Neem-Multani Mitti Mask', ingredients: '1 tbsp neem powder, 1 tbsp multani mitti, 1 tsp lemon juice, 1 tbsp water.', procedure: 'Mix into a smooth paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: 'Turmeric-Honey Mask', ingredients: ' 1 tsp turmeric powder, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mix all ingredients into a paste.', usage: ' Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
    { name: 'Charcoal-Bentonite Mask', ingredients: '1 tbsp bentonite clay, 1 tsp activated charcoal, 1 tbsp water.', procedure: 'Mix into a paste.', usage: 'Apply to face, leave for 10 min, rinse thoroughly. Use weekly', type: 'Mask' },
];
const skinOilyAgingRemedies = [
    { name: 'Gram Flour Cleanser', ingredients: '1 tbsp gram flour (besan), 1 tsp milk, 1 tbsp water.', procedure: 'Mix into a smooth paste.', usage: ' Massage onto face for 1 min, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
    { name: 'Rose Petal Wash', ingredients: '10 fresh rose petals, 1 cup water.', procedure: 'Boil petals in water, cool, strain.', usage: 'Wash face, massage gently, rinse. Use twice daily.', type: 'Cleanser' },
    { name: 'Honey-Turmeric Wash', ingredients: '1 tsp honey, ½ tsp turmeric powder, 2 tbsp water.', procedure: 'Mix ingredients into a liquid.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
    { name: 'Green Tea-Rose Toner', ingredients: ' ½ cup brewed green tea (cooled), 2 tbsp rose water.', procedure: 'Brew green tea, cool, mix with rose water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Aloe Vera Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup water, 1 tsp witch hazel.', procedure: 'Blend aloe vera with water, add witch hazel.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water.', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Almond Oil Cream', ingredients: '1 tbsp almond oil, 1 tsp aloe vera gel, 1 tsp honey.', procedure: ' Mix all ingredients into a smooth cream.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Yogurt-Avocado Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt.', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Banana-Honey Mask', ingredients: '½ ripe banana, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mash banana, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: 'Papaya-Turmeric Mask', ingredients: '2 tbsp mashed papaya, ½ tsp turmeric powder, 1 tsp honey.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
    { name: 'Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];
const skinOilyDrynessRemedies = [
    { name: 'Milk-Honey Wash', ingredients: '2 tbsp milk, 1 tsp honey.', procedure: 'Mix milk with honey.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
    { name: 'Gram Flour-Yogurt Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp yogurt.', procedure: '', usage: '', type: 'Cleanser' },
    { name: 'Cucumber-Aloe Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp aloe vera gel.', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Wash face, massage gently, rinse. Use twice daily.', type: 'Cleanser' },
    { name: 'Rose Water Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel.', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Cucumber-Honey Toner', ingredients: '½ cucumber, 1 tsp honey, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Coconut Oil-Aloe Cream', ingredients: '1 tbsp coconut oil, 1 tbsp aloe vera gel.', procedure: 'Mix coconut oil with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Shea Butter Blend', ingredients: '1 tsp shea butter, 1 tsp almond oil.', procedure: 'Melt shea butter, mix with almond oil.', usage: 'Massage into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Avocado-Yogurt Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt.', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Avocado-Honey Mask', ingredients: '½ avocado, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mash avocado, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: 'Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: ' Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
    { name: 'Banana-Coconut Mask', ingredients: '½ ripe banana, 1 tbsp coconut milk, 1 tsp honey.', procedure: 'Mash banana, mix with coconut milk and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.	', type: 'Mask' },
];
const skinOilyNormalRemedies = [
    { name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt.', procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
    { name: 'Gram Flour Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp water, 1 tsp honey.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
    { name: 'Cucumber-Milk Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp milk.', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Wash face, massage gently, rinse. Use twice daily.', type: 'Cleanser' },
    { name: 'Rose Water Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel.', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel.', procedure: 'Brew green tea, cool, mix with witch hazel.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Cucumber-Mint Toner', ingredients: ' ½ cucumber, 5 fresh mint leaves, ¼ cup water.', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type:'Toner' },
    { name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil.', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey.', procedure: 'Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Honey-Yogurt Mask', ingredients: '1 tbsp honey, 1 tbsp yogurt, ½ tsp turmeric powder.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey.', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
    { name: 'Oatmeal-Rose Mask', ingredients: '1 tbsp oatmeal, 1 tbsp rose water, 1 tsp yogurt.', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];
const skinOilyPigmentationRemedies = [
    { name: 'Turmeric-Milk Wash', ingredients: '½ tsp turmeric powder, 2 tbsp milk.', procedure: 'Mix turmeric with milk.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
    { name: ' Gram Flour-Lemon Cleanser', ingredients: ' 1 tbsp gram flour, 1 tsp lemon juice, 1 tbsp water.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
    { name: 'Tomato-Honey Wash', ingredients: '1 tbsp tomato juice, 1 tsp honey.', procedure: 'Mix tomato juice with honey.', usage: 'Wash face, massage gently, rinse. Use twice daily.', type: 'Cleanser' },
    { name: 'Potato Juice Toner', ingredients: '1 small potato, ¼ cup water.', procedure: 'Grate potato, strain juice, dilute with water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Rose Water-Lemon Toner', ingredients: '½ cup rose water, 1 tsp lemon juice.', procedure: 'Mix rose water with lemon juice.', usage:'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp aloe vera gel.', procedure: 'Brew green tea, cool, mix with aloe vera.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Aloe Vera-Turmeric Cream', ingredients: '2 tbsp aloe vera gel, ½ tsp turmeric powder, 1 tsp honey.', procedure: 'Mix all ingredients into a smooth cream.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Yogurt-Lemon Cream', ingredients: '1 tbsp yogurt, ½ tsp lemon juice.', procedure: ' Mix yogurt with lemon juice.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Potato-Turmeric Mask', ingredients: '1 tbsp potato juice, ½ tsp turmeric powder, 1 tsp honey.', procedure: 'Grate potato, strain juice, mix with turmeric and honey.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: ' Papaya-Yogurt Mask', ingredients: '2 tbsp mashed papaya, 1 tbsp yogurt, ½ tsp lemon juice.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
    { name: 'Sandalwood-Rose Mask', ingredients: '1 tbsp sandalwood powder, 1 tbsp rose water, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];
const skinOilyRednessRemedies = [
    { name: 'Cucumber-Aloe Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp aloe vera gel.', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Wash face, massage gently for 1 min, rinse with cool water. Use twice daily.', type: 'Cleanser' },
    { name: 'Oatmeal-Milk Wash', ingredients: '1 tbsp oatmeal, 2 tbsp milk.', procedure: 'Mix oatmeal with milk to form a paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
    { name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt.', procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
    { name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water.', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water.', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Aloe Vera Gel', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil.', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Yogurt-Cucumber Cream', ingredients: '1 tbsp yogurt, 1 tbsp cucumber juice.', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Aloe Vera-Honey Mask', ingredients: '2 tbsp aloe vera gel, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use twice weekly.', type: 'Mask' },
    { name: 'Cucumber-Oatmeal Mask', ingredients: '½ cucumber, 1 tbsp oatmeal, 1 tsp honey.', procedure: 'Blend cucumber, mix with oatmeal and honey.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
    { name: 'Chamomile-Yogurt Mask', ingredients: '1 tbsp chamomile tea (brewed, cooled), 1 tbsp yogurt, 1 tsp honey.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
];

const skinDryAcneRemedies = [
    { name: 'Milk-Honey Wash', ingredients: '2 tbsp milk, 1 tsp honey.', procedure: 'Mix milk with honey.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
    { name: 'Oatmeal-Yogurt Cleanser', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
    { name: 'Aloe Vera-Neem Wash', ingredients: '1 tbsp aloe vera gel, 1 tsp neem powder, 2 tbsp water.', procedure: 'Mix ingredients into a liquid.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
    { name: 'Rose Water Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel.', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
    { name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
    { name: 'Cucumber-Honey Toner', ingredients: '½ cucumber, 1 tsp honey, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
    { name: 'Shea Butter Cream', ingredients: '1 tbsp shea butter, 1 tsp almond oil.', procedure: 'Melt shea butter, mix with almond oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
    { name: 'Avocado-Yogurt Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt.', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
    { name: 'Coconut Oil-Aloe Blend', ingredients: '1 tbsp coconut oil, 1 tbsp aloe vera gel.', procedure: 'Mix coconut oil with aloe vera.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
    { name: 'Honey-Neem Mask', ingredients: '1 tbsp honey, 1 tsp neem powder, 1 tsp yogurt.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
    { name: 'Oatmeal-Turmeric Mask', ingredients: '1 tbsp oatmeal, ½ tsp turmeric powder, 1 tbsp yogurt.', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
    { name: 'Aloe Vera-Clay Mask', ingredients: '1 tbsp bentonite clay, 1 tbsp aloe vera gel, 1 tsp honey.', procedure: 'Mix into a smooth paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
];
const skinDryAgingRemedies = [
    { name: 'Milk-Rose Wash', ingredients: '2 tbsp milk, 1 tbsp rose water', procedure: 'Mix milk with rose water.', usage: ' Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: ' Gram Flour-Honey Cleanser', ingredients: ' 1 tbsp gram flour, 1 tsp honey, 1 tbsp water.', procedure: 'Mix into a smooth paste.', usage: ' Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: '. Oatmeal-Milk Wash', ingredients: ' 1 tbsp oatmeal, 2 tbsp milk.', procedure: ' Mix oatmeal with milk to form a paste.', usage: 'Wash face, massage gently, rinse with cool water.Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: ' ½ cup rose water, 1 tbsp aloe vera gel.', procedure: ' Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: ' Green Tea Toner', ingredients: ' ½ cup brewed green tea (cooled), 1 tsp witch hazel.', procedure: 'Brew green tea, cool, mix with witch hazel.', usage: ' Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: ' Cucumber-Milk Toner', ingredients: '½ cucumber, 2 tbsp milk.', procedure: ' Blend cucumber, strain juice, mix with milk.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: ' Shea Butter-Avocado Cream', ingredients: ' 1 tbsp shea butter, 1 tbsp mashed avocado.', procedure: ' Melt shea butter, mix with mashed avocado.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: ' Almond Oil Blend', ingredients: ' 1 tbsp almond oil, 1 tsp rose water.', procedure: 'Mix almond oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Honey Cream', ingredients: '1 tbsp coconut oil, 1 tsp honey.', procedure: ' Mix coconut oil with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Banana-Avocado Mask', ingredients: '½ ripe banana, ½ avocado, 1 tsp honey.', procedure: ' Mash banana and avocado, mix with honey.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: ' Papaya-Milk Mask', ingredients: ' 2 tbsp mashed papaya, 1 tbsp milk, 1 tsp honey.', procedure: ' Mix all ingredients into a paste.', usage: ' Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Honey Mask', ingredients: ' 1 tbsp oatmeal, 1 tbsp honey, 1 tbsp yogurt.', procedure: ' Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinDryDrynessRemedies = [
    { name: 'Milk-Almond Wash', ingredients: '2 tbsp milk, 1 tsp almond oil.', procedure: ' Mix milk with almond oil.', usage: ' Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: ' Oatmeal-Honey Cleanser', ingredients: ': 1 tbsp oatmeal, 1 tsp honey, 1 tbsp water.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: ' Aloe Vera-Milk Wash', ingredients: '1 tbsp aloe vera gel, 2 tbsp milk.', procedure: ': Mix aloe vera with milk.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: ' Rose Water-Honey Toner', ingredients: ' ½ cup rose water, 1 tsp honey.', procedure: 'Mix rose water with honey.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: ' Chamomile Toner', ingredients: ' 1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Aloe Toner', ingredients: ' ½ cucumber, 1 tbsp aloe vera gel, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with aloe vera and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Shea Butter-Coconut Cream', ingredients: ': 1 tbsp shea butter, 1 tbsp coconut oil.', procedure: 'Melt shea butter, mix with coconut oil.', usage: ' Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Avocado-Honey Cream', ingredients: ' 1 tbsp mashed avocado, 1 tsp honey.', procedure: ' Mash avocado, mix with honey.', usage: ' Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: ' Almond Oil-Aloe Blend', ingredients: ' 1 tbsp almond oil, 1 tbsp aloe vera gel.', procedure: ' Mix almond oil with aloe vera.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: '. Avocado-Honey Mask', ingredients: ' ½ avocado, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mash avocado, mix with honey and yogurt.', usage: ' Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Banana-Milk Mask', ingredients: '½ ripe banana, 1 tbsp milk, 1 tsp honey.', procedure: ' Mash banana, mix with milk and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: ' Oatmeal-Coconut Mask', ingredients: '1 tbsp oatmeal, 1 tbsp coconut milk, 1 tsp honey.', procedure: ' Mix into a thick paste.', usage: ': Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinDryNormalRemedies = [
    { name: ' Rose Water-Milk Wash', ingredients: ' 2 tbsp rose water, 1 tbsp milk.', procedure: ' Mix rose water with milk.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: '. Gram Flour-Yogurt Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp yogurt.', procedure: ' Mix into a smooth paste.', usage: ' Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Honey Wash', ingredients: '2 tbsp cucumber juice, 1 tsp honey.', procedure: ' Blend cucumber, strain juice, mix with honey.', usage: ' Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel.', procedure: ' Mix rose water with aloe vera.', usage: ' Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel.', procedure: ' Brew green tea, cool, mix with witch hazel.', usage: ' Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: ' ½ cucumber, 5 fresh mint leaves, ¼ cup water.', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: ' Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: ' Aloe Vera-Coconut Cream', ingredients: ' 2 tbsp aloe vera gel, 1 tsp coconut oil.', procedure: ' Mix aloe vera with coconut oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: ' 1 tbsp yogurt, 1 tsp honey.', procedure: 'Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: ' Almond Oil Blend', ingredients: '1 tsp almond oil, 1 tsp rose water.', procedure: 'Mix almond oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: 'Honey-Yogurt Mask', ingredients: '1 tbsp honey, 1 tbsp yogurt, ½ tsp turmeric powder.', procedure: ' Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: ' Cucumber-Aloe Mask', ingredients: ': ½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey.', procedure: ' Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Rose Mask', ingredients: ' 1 tbsp oatmeal, 1 tbsp rose water, 1 tsp yogurt.', procedure: 'Mix into a thick paste.', usage: ' Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinDryPigmentationRemedies = [
    { name: 'Turmeric-Yogurt Wash', ingredients: ' ½ tsp turmeric powder, 2 tbsp yogurt.', procedure: 'Mix turmeric with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: ' Gram Flour-Tomato Cleanser', ingredients: ' 1 tbsp gram flour, 1 tbsp tomato juice.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: 'Milk-Lemon Wash', ingredients: ' 2 tbsp milk, ½ tsp lemon juice.', procedure: ' Mix milk with lemon juice', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: ' Potato Juice Toner', ingredients: ' 1 small potato, ¼ cup water.', procedure: 'Grate potato, strain juice, dilute with water.', usage: ' Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tbsp aloe vera gel.', procedure: 'Mix rose water with aloe vera.', usage: ' Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Lemon Toner', ingredients: ' ½ cucumber, ½ tsp lemon juice, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with lemon juice and water.', usage: ' Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: ' Aloe Vera-Turmeric Cream', ingredients: ' 2 tbsp aloe vera gel, ½ tsp turmeric powder, 1 tsp honey.', procedure: ' Mix all ingredients into a smooth cream.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: ' Shea Butter Blend', ingredients: ' 1 tbsp shea butter, 1 tsp almond oil.', procedure: 'Melt shea butter, mix with almond oil.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: ' Yogurt-Avocado Cream', ingredients: '1 tbsp yogurt, 1 tbsp mashed avocado.', procedure: 'Mash avocado, mix with yogurt.', usage: ' Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: ' Potato-Honey Mask', ingredients: '1 tbsp potato juice, 1 tbsp honey, ½ tsp turmeric powder.', procedure: ' Grate potato, strain juice, mix with honey and turmeric.', usage: ' Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Papaya-Yogurt Mask', ingredients: ' 2 tbsp mashed papaya, 1 tbsp yogurt, ½ tsp lemon juice.', procedure: ' Mix all ingredients into a paste.', usage: ' Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Sandalwood-Milk Mask', ingredients: '1 tbsp sandalwood powder, 1 tbsp milk, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: ' Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinDryRednessRemedies = [
    { name: ' Aloe Vera-Oatmeal Wash', ingredients: '1 tbsp aloe vera gel, 1 tbsp oatmeal, 2 tbsp water.', procedure: ': Mix oatmeal with aloe vera and water to form a paste.', usage: 'Massage onto face for 1 min, rinse with cool water. Use twice daily.', type: 'Cleanser' },
{ name: 'Milk-Rose Wash', ingredients: '2 tbsp milk, 1 tbsp rose water.', procedure: 'Mix milk with rose water.', usage: ' Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Yogurt Wash', ingredients: ' 2 tbsp cucumber juice, 1 tbsp yogurt.', procedure: ' Blend cucumber, strain juice, mix with yogurt.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: ' Chamomile Toner', ingredients: ' 1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: ' Aloe Vera-Rose Toner', ingredients: ' 2 tbsp aloe vera gel, ¼ cup rose water.', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water.', procedure: ' Blend cucumber and mint, strain juice, mix with water.', usage: ' Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Shea Butter-Aloe Cream', ingredients: '1 tbsp shea butter, 1 tbsp aloe vera gel.', procedure: ' Melt shea butter, mix with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: ' Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Cucumber Cream', ingredients: '1 tbsp yogurt, 1 tbsp cucumber juice.', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: ' Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: ' Aloe Vera-Honey Mask', ingredients: ' 2 tbsp aloe vera gel, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Oatmeal Mask', ingredients: '½ cucumber, 1 tbsp oatmeal, 1 tsp honey.', procedure: ' Blend cucumber, mix with oatmeal and honey.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
{ name: ' Chamomile-Yogurt Mask', ingredients: ' 1 tbsp chamomile tea (brewed, cooled), 1 tbsp yogurt, 1 tsp honey.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
];


const skinNormalAcneRemedies = [
    { name: 'Neem-Honey Wash', ingredients: '1 tsp neem powder, 1 tsp honey, 2 tbsp water.', procedure: ' Mix neem powder with honey and water.', usage: ' Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Gram Flour-Yogurt Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp yogurt.', procedure: 'Mix into a smooth paste', usage: ' Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: ' Rose Water-Tea Tree Wash', ingredients: '2 tbsp rose water, 2 drops tea tree essential oil.', procedure: ' Mix rose water with tea tree oil.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: '. Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel.', procedure: ' Brew green tea, cool, mix with witch hazel.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: ' Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water.', procedure: ' Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Lemon Toner', ingredients: '½ cucumber, ½ tsp lemon juice, ¼ cup water', procedure: ' Blend cucumber, strain juice, mix with lemon juice and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil.', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey.', procedure: ' Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: ' 1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: ' Neem-Turmeric Mask', ingredients: ' 1 tsp neem powder, ½ tsp turmeric powder, 1 tbsp yogurt.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Honey-Clay Mask', ingredients: '1 tbsp bentonite clay, 1 tbsp honey, 1 tsp water.', procedure: 'Mix into a smooth paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Yogurt Mask', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinNormalAgingRemedies = [
    { name: ' Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt.', procedure: 'Mix rose water with yogurt.', usage: ' Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Gram Flour-Milk Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp milk.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: ' Oatmeal-Honey Wash', ingredients: '1 tbsp oatmeal, 1 tsp honey, 2 tbsp water.', procedure: 'Mix oatmeal with honey and water to form a paste.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: ' Green Tea-Rose Toner', ingredients: '½ cup brewed green tea (cooled), 2 tbsp rose water.', procedure: ' Brew green tea, cool, mix with rose water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily', type: 'Toner' },
{ name: ' Aloe Vera Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup water, 1 tsp witch hazel.', procedure: 'Blend aloe vera with water, add witch hazel.', usage: ' Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Milk Toner', ingredients: '½ cucumber, 2 tbsp milk.', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: ' Almond Oil-Aloe Cream', ingredients: '1 tbsp almond oil, 1 tbsp aloe vera gel.', procedure: 'Mix almond oil with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water.', procedure: 'Mix coconut oil with rose water.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Avocado Cream', ingredients: '1 tbsp yogurt, 1 tbsp mashed avocado.', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: ' Banana-Honey Mask', ingredients: ' ½ ripe banana, 1 tbsp honey, 1 tsp yogurt.', procedure: 'Mash banana, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: ' Papaya-Turmeric Mask', ingredients: '2 tbsp mashed papaya, ½ tsp turmeric powder, 1 tsp honey.', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: ' Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey.', procedure: ' Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
];

const skinNormalDrynessRemedies = [
    { name: ' Milk-Honey Wash', ingredients: ' 2 tbsp milk, 1 tsp honey.', procedure: ' Mix milk with honey.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Yogurt Cleanser', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt.', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.', type: 'Cleanser' },
{ name: ' Aloe Vera-Cucumber Wash', ingredients: '1 tbsp aloe vera gel, 2 tbsp cucumber juice.', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water Toner', ingredients: ' ½ cup rose water, 1 tsp aloe vera gel.', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Chamomile Toner', ingredients: ' 1 chamomile tea bag, ½ cup hot water.', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Honey Toner', ingredients: ' ½ cucumber, 1 tsp honey, ¼ cup water.', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: ' Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: ' Shea Butter Cream', ingredients: ' 1 tbsp shea butter, 1 tsp almond oil.', procedure: 'Melt shea butter, mix with almond oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Avocado-Yogurt Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt.', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Aloe Blend', ingredients: '1 tbsp coconut oil, 1 tbsp aloe vera gel.', procedure: ' Mix coconut oil with aloe vera.', usage: ' Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: ' Avocado-Honey Mask', ingredients: ' ½ avocado, 1 tbsp honey, 1 tsp yogurt.', procedure: ' Mash avocado, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: ' Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey.', procedure: 'Mix into a thick paste.', usage: ' Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
{ name: ' Banana-Coconut Mask', ingredients: '½ ripe banana, 1 tbsp coconut milk, 1 tsp honey.', procedure: 'Mash banana, mix with coconut milk and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
];

const skinNormalNormalRemedies = [
    { name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', procedure: 'Mix rose water with yogurt.',usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Gram Flour Cleanser',ingredients: '1 tbsp gram flour, 1 tbsp water, 1 tsp honey',procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse after 1 min. Use daily.',type: 'Cleanser' },
{name: 'Cucumber-Milk Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp milk', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.',type: 'Cleanser'},
{ name: 'Rose Water Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel',procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.',type: 'Toner' },
{name: 'Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel', procedure: 'Brew green tea, cool, mix with witch hazel.',usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{name: 'Cucumber-Mint Toner',ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water',procedure: 'Blend cucumber and mint, strain juice, mix with water.',usage: 'Apply with a cotton pad, let dry. Use daily.',type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer'},
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.',type: 'Moisturizer'},
{name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey',procedure: 'Mix yogurt with honey.',usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.',type: 'Moisturizer'},
{ name: 'Honey-Yogurt Mask',ingredients: '1 tbsp honey, 1 tbsp yogurt, ½ tsp turmeric powder', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.',type: 'Mask'},
{ name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.',type: 'Mask'},
{ name: 'Oatmeal-Rose Mask', ingredients: '1 tbsp oatmeal, 1 tbsp rose water, 1 tsp yogurt', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask'}
];

const skinNormalPigmentationRemedies = [
    { name: 'Turmeric-Milk Wash', ingredients: '½ tsp turmeric powder, 2 tbsp milk', procedure: 'Mix turmeric with milk to form a liquid.',usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.',type: 'Cleanser'},
{ name: 'Gram Flour-Lemon Cleanser',ingredients: '1 tbsp gram flour (besan), ½ tsp lemon juice, 1 tbsp water',procedure: 'Mix into a smooth paste.', usage: 'Gently massage onto face, rinse with cool water. Use daily.',type: 'Cleanser' },
{name: 'Tomato-Rose Wash', ingredients: '1 tbsp tomato juice, 1 tbsp rose water', procedure: 'Mix tomato juice with rose water.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{name: 'Potato Juice Toner', ingredients: '1 small potato, ¼ cup water',procedure: 'Grate potato, strain juice, dilute with water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.',type: 'Toner' },
{ name: 'Rose Water-Lemon Toner', ingredients: '½ cup rose water, ½ tsp lemon juice', procedure: 'Mix rose water with lemon juice.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner'},
{ name: 'Green Tea-Aloe Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp aloe vera gel',procedure: 'Brew green tea, cool, mix with aloe vera.', usage: 'Apply with a cotton pad, let dry. Use daily.',type: 'Toner'},
{ name: 'Aloe Vera-Turmeric Cream',ingredients: '2 tbsp aloe vera gel, ¼ tsp turmeric powder, 1 tsp honey', procedure: 'Mix all ingredients into a smooth cream.',usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.',type: 'Moisturizer' },
{name: 'Coconut Oil-Rose Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water',procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.',type: 'Moisturizer'},
{ name: 'Yogurt-Lemon Cream', ingredients: '1 tbsp yogurt, ½ tsp lemon juice', procedure: 'Mix yogurt with lemon juice.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer'},
{ name: 'Potato-Yogurt Mask', ingredients: '1 tbsp potato juice, 1 tbsp yogurt, ½ tsp honey',procedure: 'Grate potato, strain juice, mix with yogurt and honey.',usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{name: 'Papaya-Turmeric Mask', ingredients: '2 tbsp mashed papaya, ¼ tsp turmeric powder, 1 tsp honey', procedure: 'Mix all ingredients into a paste.',usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Sandalwood-Rose Mask', ingredients: '1 tbsp sandalwood powder, 1 tbsp rose water, 1 tsp yogurt',procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinNormalRednessRemedies = [
    { name: 'Cucumber-Aloe Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp aloe vera gel', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Massage onto face for 1 min, rinse with cool water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Milk Wash', ingredients: '1 tbsp oatmeal, 2 tbsp milk', procedure: 'Mix oatmeal with milk to form a paste.', usage: 'Gently massage onto face, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face, rinse with cool water. Use daily.', type: 'Cleanser'},
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Rose Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face post-toner. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Cucumber Cream', ingredients: '1 tbsp yogurt, 1 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Aloe Vera-Honey Mask', ingredients: '2 tbsp aloe vera gel, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Oatmeal Mask', ingredients: '½ cucumber, 1 tbsp oatmeal, 1 tsp honey', procedure: 'Blend cucumber, mix with oatmeal and honey.', usage: 'Apply to face, leave for 15 min,rinse gently. Use weekly.', type: 'Mask' },
{ name: 'Chamomile-Yogurt Mask', ingredients: '1 tbsp chamomile tea (brewed, cooled), 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' }
];

const skinCombinationAcneRemedies = [
    { name: 'Neem-Tulsi Wash', ingredients: '10 fresh neem leaves, 10 fresh tulsi leaves, 1 cup water', procedure: 'Boil neem and tulsi leaves in water, cool, strain.', usage: 'Wash face, massage gently for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Multani Mitti-Yogurt Cleanser', ingredients: '1 tbsp multani mitti, 1 tbsp yogurt', procedure: 'Mix into a smooth paste.', usage: 'Massage onto T-zone, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Tea Tree-Rose Wash', ingredients: '2 tbsp rose water, 2 drops tea tree essential oil', procedure: 'Mix rose water with tea tree oil.', usage: ' Wash face, focusing on oily areas, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Green Tea-Witch Hazel Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel', procedure: 'Brew green tea, cool, mix with witch hazel.', usage: 'Apply with a cotton pad, focusing on T-zone, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Cucumber Toner', ingredients: '2 tbsp aloe vera gel, 2 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Rose Water-Tea Tree Toner', ingredients: '½ cup rose water, 2 drops tea tree essential oil', procedure: 'Mix rose water with tea tree oil, store in a spray bottle.', usage: 'Spritz or apply with a cotton pad post-cleansing. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Grape seed Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp grapeseed oil', procedure: 'Mix aloe vera with grapeseed oil.', usage: 'Apply lightly to T-zone, more generously to cheeks, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey', procedure: 'Mix yogurt with honey.', usage: 'Apply to cheeks, avoid T-zone, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Jojoba Oil Blend', ingredients: '1 tsp jojoba oil, 1 tsp rose water', procedure: 'Mix jojoba oil with rose water.', usage: 'Massage lightly into face, focusing on dry areas. Use daily.', type: 'Moisturizer' },
{ name: 'Neem-Multani Mitti Mask', ingredients: '1 tbsp neem powder, 1 tbsp multani mitti, 1 tbsp yogurt', procedure: 'Mix into a smooth paste.', usage: 'Apply to T-zone, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Honey-Turmeric Mask', ingredients: '1 tbsp honey, ¼ tsp turmeric powder, 1 tsp yogurt', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to entire face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Bentonite Clay-Aloe Mask', ingredients: '1 tbsp bentonite clay, 1 tbsp aloe vera gel, 1 tsp water', procedure: 'Mix into a paste.', usage: 'Apply to T-zone, leave for 10 min, rinse thoroughly. Use weekly.', type: 'Mask' }
];

const skinCombinationAgingRemedies = [
    { name: 'Gram Flour-Milk Wash', ingredients: '1 tbsp gram flour, 1 tbsp milk', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Rose Water-Honey Wash', ingredients: '2 tbsp rose water, 1 tsp honey', procedure: 'Mix rose water with honey.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Yogurt Wash', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt', procedure: 'Mix oatmeal with yogurt to form a paste.', usage: 'Massage onto face, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Green Tea-Rose Toner', ingredients: '½ cup brewed green tea (cooled), 2 tbsp rose water', procedure: 'Brew green tea, cool, mix with rose water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Mint Toner', ingredients: '2 tbsp aloe vera gel, 5 fresh mint leaves, ¼ cup water', procedure: 'Blend mint leaves with water, strain, mix with aloe vera.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Honey Toner', ingredients: '½ cucumber, 1 tsp honey, ¼ cup water', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Almond Oil-Aloe Cream', ingredients: '1 tbsp almond oil, 1 tbsp aloe vera gel', procedure: 'Mix almond oil with aloe vera.', usage: 'Apply lightly to T-zone, generously to cheeks, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage into dry areas, avoid T-zone. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Avocado Cream', ingredients: '1 tbsp yogurt, 1 tbsp mashed avocado', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to cheeks, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Banana-Honey Mask', ingredients: '½ ripe banana, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mash banana, mix with honey and yogurt.', usage: 'Apply to entire face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Papaya-Milk Mask', ingredients: '2 tbsp mashed papaya, 1 tbsp milk, 1 tsp honey', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Rose Mask', ingredients: '1 tbsp oatmeal, 1 tbsp rose water, 1 tsp yogurt', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinCombinationDrynessRemedies = [
    { name: 'Milk-Honey Wash', ingredients: '2 tbsp milk, 1 tsp honey', procedure: 'Mix milk with honey.', usage: 'Massage onto cheeks, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Yogurt Cleanser', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt', procedure: 'Mix into a smooth paste.', usage: 'Massage onto dry areas, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Aloe Vera-Cucumber Wash', ingredients: '1 tbsp aloe vera gel, 2 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Wash face, focusing on cheeks, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tbsp aloe vera gel', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad, focusing on dry areas, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on cheeks with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Honey Toner', ingredients: '½ cucumber, 1 tsp honey, ¼ cup water', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: 'Apply with a cotton pad to dry areas, let dry. Use daily.', type: 'Toner' },
{ name: 'Shea Butter-Coconut Cream', ingredients: '1 tbsp shea butter, 1 tsp coconut oil', procedure: 'Melt shea butter, mix with coconut oil.', usage: 'Apply generously to cheeks, lightly to T-zone, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Avocado-Yogurt Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to cheeks, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Almond Oil-Aloe Blend', ingredients: '1 tbsp almond oil, 1 tbsp aloe vera gel', procedure: 'Mix almond oil with aloe vera.', usage: 'Massage into dry areas, avoid T-zone. Use daily.', type: 'Moisturizer' },
{ name: 'Avocado-Honey Mask', ingredients: '½ avocado, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mash avocado, mix with honey and yogurt.', usage: 'Apply to cheeks, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Banana-Milk Mask', ingredients: '½ ripe banana, 1 tbsp milk, 1 tsp honey', procedure: 'Mash banana, mix with milk and honey.', usage: 'Apply to dry areas, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Coconut Mask', ingredients: '1 tbsp oatmeal, 1 tbsp coconut milk, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to cheeks, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
] ;

const skinCombinationNormalRemedies = [
    { name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Gram Flour-Honey Cleanser', ingredients: '1 tbsp gram flour, 1 tsp honey, 1 tbsp water', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Milk Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp milk', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Green Tea Toner', ingredients: '½ cup brewed green tea (cooled), 1 tsp witch hazel', procedure: 'Brew green tea, cool, mix with witch hazel.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply lightly to T-zone, generously to cheeks, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage into cheeks, avoid T-zone. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey', procedure: 'Mix yogurt with honey.', usage: 'Apply to cheeks, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Honey-Yogurt Mask', ingredients: '1 tbsp honey, 1 tbsp yogurt, ¼ tsp turmeric powder', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to entire face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Oatmeal-Rose Mask', ingredients: '1 tbsp oatmeal, 1 tbsp rose water, 1 tsp yogurt', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use weekly.', type: 'Mask' }
];

const skinCombinationPigmentationRemedies = [
    { name: 'Turmeric-Yogurt Wash', ingredients: '¼ tsp turmeric powder, 2 tbsp yogurt', procedure: 'Mix turmeric with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Gram Flour-Tomato Cleanser', ingredients: '1 tbsp gram flour, 1 tbsp tomato juice', procedure: 'Mix into a smooth paste.', usage: 'Massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Lemon Wash', ingredients: '2 tbsp rose water, ½ tsp lemon juice', procedure: 'Mix rose water with lemon juice.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Potato Juice Toner', ingredients: '1 small potato, ¼ cup water', procedure: 'Grate potato, strain juice, dilute with water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Lemon Toner', ingredients: '2 tbsp aloe vera gel, ½ tsp lemon juice, ¼ cup water', procedure: 'Mix aloe vera with lemon juice and water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Rose Water-Turmeric Toner', ingredients: '½ cup rose water, pinch of turmeric powder', procedure: 'Mix rose water with turmeric.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Turmeric Cream', ingredients: '2 tbsp aloe vera gel, ¼ tsp turmeric powder, 1 tsp honey', procedure: 'Mix all ingredients into a smooth cream.', usage: 'Apply lightly to T-zone, generously to cheeks, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Jojoba Oil Blend', ingredients: '1 tsp jojoba oil, 1 tsp rose water', procedure: 'Mix jojoba oil with rose water.', usage: 'Massage into cheeks, avoid T-zone. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Papaya Cream', ingredients: '1 tbsp yogurt, 1 tbsp mashed papaya', procedure: 'Mash papaya, mix with yogurt.', usage: 'Apply to cheeks, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Potato-Honey Mask', ingredients: '1 tbsp potato juice, 1 tbsp honey, ¼ tsp turmeric powder', procedure: 'Grate potato, strain juice, mix with honey and turmeric.', usage: 'Apply to entire face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Papaya-Yogurt Mask', ingredients: '2 tbsp mashed papaya, 1 tbsp yogurt, ½ tsp lemon juice', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Sandalwood-Milk Mask', ingredients: '1 tbsp sandalwood powder, 1 tbsp milk, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinCombinationRednessRemedies = [
    { name: 'Aloe Vera-Cucumber Wash', ingredients: '1 tbsp aloe vera gel, 2 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with aloe vera.', usage: 'Massage onto face for 1 min, rinse with cool water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Milk Wash', ingredients: '1 tbsp oatmeal, 2 tbsp milk', procedure: 'Mix oatmeal with milk to form a paste.', usage: 'Gently massage onto face, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face, rinse with cool water. Use daily.', type: 'Cleanser'},
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply lightly to T-zone, generously to cheeks, post-toner. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Rose Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage into cheeks, avoid T-zone. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Cucumber Cream', ingredients: '1 tbsp yogurt, 1 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Apply to cheeks, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Aloe Vera-Honey Mask', ingredients: '2 tbsp aloe vera gel, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to entire face, leave for 15 min, rinse with cool water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Oatmeal Mask', ingredients: '½ cucumber, 1 tbsp oatmeal, 1 tsp honey', procedure: 'Blend cucumber, mix with oatmeal and honey.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' },
{ name: 'Chamomile-Yogurt Mask', ingredients: '1 tbsp chamomile tea (brewed, cooled), 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' }
];

const skinSensitiveAcneRemedies = [
    { name: 'Oatmeal-Milk Wash', ingredients: '1 tbsp oatmeal, 2 tbsp milk', procedure: 'Mix oatmeal with milk to form a paste.', usage: 'Gently massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Aloe Vera-Honey Wash', ingredients: '1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Mix aloe vera with honey.', usage: 'Massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', procedure: 'Mix rose water with yogurt.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber Water Toner', ingredients: '½ cucumber, ¼ cup water', procedure: 'Blend cucumber, strain juice, dilute with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Shea Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp shea butter', procedure: 'Melt shea butter, mix with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Rose Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer'},
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey', procedure: 'Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer'},
{ name: 'Oatmeal-Honey Mask', ingredients: '1 tbsp oatmeal, 1 tbsp honey, 1 tbsp yogurt', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Aloe Vera-Yogurt Mask', ingredients: '2 tbsp aloe vera gel, 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Cucumber-Honey Mask', ingredients: '½ cucumber, 1 tbsp honey, 1 tsp yogurt', procedure: 'Blend cucumber, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinSensitiveAgingRemedies = [
    { name: 'Milk-Honey Wash', ingredients: '2 tbsp milk, 1 tsp honey', procedure: 'Mix milk with honey.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Rose Wash', ingredients: '1 tbsp oatmeal, 2 tbsp rose water', procedure: 'Mix oatmeal with rose water to form a paste.', usage: 'Gently massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Aloe Vera-Yogurt Wash', ingredients: '1 tbsp aloe vera gel, 1 tbsp yogurt', procedure: 'Mix aloe vera with yogurt.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Chamomile-Rose Toner', ingredients: '¼ cup chamomile tea (brewed, cooled), ¼ cup rose water', procedure: 'Brew chamomile tea, cool, mix with rose water.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup water', procedure: 'Mix aloe vera with water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Milk Toner', ingredients: '½ cucumber, 2 tbsp milk', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Shea Butter-Aloe Cream', ingredients: '1 tbsp shea butter, 1 tbsp aloe vera gel', procedure: 'Melt shea butter, mix with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Avocado Cream', ingredients: '1 tbsp yogurt, 1 tbsp mashed avocado', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Banana-Honey Mask', ingredients: '½ ripe banana, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mash banana, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Aloe Vera-Cucumber Mask', ingredients: '2 tbsp aloe vera gel, 2 tbsp cucumber juice, 1 tsp honey', procedure: 'Blend cucumber, strain juice, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinSensitiveDrynessRemedies = [
    { name: 'Milk-Oatmeal Wash', ingredients: '2 tbsp milk, 1 tbsp oatmeal', procedure: 'Mix milk with oatmeal to form a paste.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Aloe Vera-Honey Wash', ingredients: '1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Mix aloe vera with honey.', usage: 'Gently massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Milk Wash', ingredients: '2 tbsp rose water, 1 tbsp milk', procedure: 'Mix rose water with milk.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tbsp aloe vera gel', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Honey Toner', ingredients: '½ cucumber, 1 tsp honey, ¼ cup water', procedure: 'Blend cucumber, strain juice, mix with honey and water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Shea Butter-Coconut Cream', ingredients: '1 tbsp shea butter, 1 tsp coconut oil', procedure: 'Melt shea butter, mix with coconut oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Avocado-Yogurt Cream', ingredients: '1 tbsp mashed avocado, 1 tbsp yogurt', procedure: 'Mash avocado, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Almond Oil-Aloe Blend', ingredients: '1 tbsp almond oil, 1 tbsp aloe vera gel', procedure: 'Mix almond oil with aloe vera.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer' },
{ name: 'Avocado-Honey Mask', ingredients: '½ avocado, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mash avocado, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Oatmeal-Milk Mask', ingredients: '1 tbsp oatmeal, 1 tbsp milk, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.',type: 'Mask' },
{ name: 'Banana-Coconut Mask', ingredients: '½ ripe banana, 1 tbsp coconut milk, 1 tsp honey', procedure: 'Mash banana, mix with coconut milk and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' }
];

const skinSensitiveNormalRemedies = [
    { name: 'Rose Water-Yogurt Wash', ingredients: '2 tbsp rose water, 1 tbsp yogurt', 
procedure: 'Mix rose water with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Honey Cleanser', ingredients: '1 tbsp oatmeal, 1 tsp honey, 1 tbsp water', procedure: 'Mix into a smooth paste.', usage: 'Gently massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Milk Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp milk', procedure: 'Blend cucumber, strain juice, mix with milk.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tsp aloe vera gel', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber-Mint Toner', ingredients: '½ cucumber, 5 fresh mint leaves, ¼ cup water', procedure: 'Blend cucumber and mint, strain juice, mix with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Jojoba Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp jojoba oil', procedure: 'Mix aloe vera with jojoba oil.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey', procedure: 'Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Oatmeal-Yogurt Mask', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Rose Water-Honey Mask', ingredients: '1 tbsp rose water, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinSensitivePigmentationRemedies = [
    { name: 'Milk-Yogurt Wash', ingredients: '2 tbsp milk, 1 tbsp yogurt', procedure: 'Mix milk with yogurt.', usage: 'Massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Oatmeal-Rose Wash', ingredients: '1 tbsp oatmeal, 2 tbsp rose water', procedure: 'Mix oatmeal with rose water to form a paste.', usage: 'Gently massage onto face, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Honey Wash', ingredients: '2 tbsp cucumber juice, 1 tsp honey', procedure: 'Blend cucumber, strain juice, mix with honey.', usage: 'Wash face, massage gently, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Rose Water-Aloe Toner', ingredients: '½ cup rose water, 1 tbsp aloe vera gel', procedure: 'Mix rose water with aloe vera.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber Water Toner', ingredients: '½ cucumber, ¼ cup water', procedure: 'Blend cucumber, strain juice, dilute with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Shea Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp shea butter', procedure: 'Melt shea butter, mix with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Honey Cream', ingredients: '1 tbsp yogurt, 1 tsp honey', procedure: 'Mix yogurt with honey.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Oatmeal-Yogurt Mask', ingredients: '1 tbsp oatmeal, 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Papaya-Honey Mask', ingredients: '2 tbsp mashed papaya, 1 tbsp honey, 1 tsp yogurt', procedure: 'Mash papaya, mix with honey and yogurt.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse gently. Use weekly.', type: 'Mask' }
];

const skinSensitiveRednessRemedies = [
    { name: 'Oatmeal-Milk Wash', ingredients: '1 tbsp oatmeal, 2 tbsp milk', procedure: 'Mix oatmeal with milk to form a paste.', usage: 'Gently massage onto face for 1 min, rinse with lukewarm water. Use twice daily.', type: 'Cleanser' },
{ name: 'Aloe Vera-Rose Wash', ingredients: '1 tbsp aloe vera gel, 2 tbsp rose water', procedure: 'Mix aloe vera with rose water.', usage: 'Wash face, massage gently, rinse with cool water. Use daily.', type: 'Cleanser' },
{ name: 'Cucumber-Yogurt Wash', ingredients: '2 tbsp cucumber juice, 1 tbsp yogurt', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Massage onto face, rinse with lukewarm water. Use daily.', type: 'Cleanser' },
{ name: 'Chamomile Toner', ingredients: '1 chamomile tea bag, ½ cup hot water', procedure: 'Steep tea bag in hot water for 10 min, cool.', usage: 'Apply with a cotton pad post-cleansing, let dry. Use twice daily.', type: 'Toner' },
{ name: 'Aloe Vera-Rose Toner', ingredients: '2 tbsp aloe vera gel, ¼ cup rose water', procedure: 'Mix aloe vera with rose water.', usage: 'Dab on face with a cotton pad, do not rinse. Use daily.', type: 'Toner' },
{ name: 'Cucumber Water Toner', ingredients: '½ cucumber, ¼ cup water', procedure: 'Blend cucumber, strain juice, dilute with water.', usage: 'Apply with a cotton pad, let dry. Use daily.', type: 'Toner' },
{ name: 'Aloe Vera-Shea Cream', ingredients: '2 tbsp aloe vera gel, 1 tsp shea butter', procedure: 'Melt shea butter, mix with aloe vera.', usage: 'Apply a thin layer to face post-toner, massage gently. Use twice daily.', type: 'Moisturizer' },
{ name: 'Coconut Oil-Rose Blend', ingredients: '1 tsp coconut oil, 1 tsp rose water', procedure: 'Mix coconut oil with rose water.', usage: 'Massage lightly into face. Use daily.', type: 'Moisturizer' },
{ name: 'Yogurt-Cucumber Cream', ingredients: '1 tbsp yogurt, 1 tbsp cucumber juice', procedure: 'Blend cucumber, strain juice, mix with yogurt.', usage: 'Apply to face, leave for 10 min, wipe off excess. Use daily.', type: 'Moisturizer' },
{ name: 'Oatmeal-Honey Mask', ingredients: '1 tbsp oatmeal, 1 tbsp honey, 1 tbsp yogurt', procedure: 'Mix into a thick paste.', usage: 'Apply to face, leave for 15 min, rinse with lukewarm water. Use twice weekly.', type: 'Mask' },
{ name: 'Cucumber-Aloe Mask', ingredients: '½ cucumber, 1 tbsp aloe vera gel, 1 tsp honey', procedure: 'Blend cucumber, mix with aloe vera and honey.', usage: 'Apply to face, leave for 15 min, rinse with cool water. Use weekly.', type: 'Mask' },
{ name: 'Chamomile-Yogurt Mask', ingredients: '1 tbsp chamomile tea (brewed, cooled), 1 tbsp yogurt, 1 tsp honey', procedure: 'Mix all ingredients into a paste.', usage: 'Apply to face, leave for 10 min, rinse with cool water. Use weekly.', type: 'Mask' }
];

// Define allowed conditions for hair and skin
const HAIR_CONDITIONS = ['Oily', 'Dandruff', 'Normal', 'Thinning', 'Dryness', 'Damage'];
const SKIN_CONDITIONS = ['Acne', 'Redness', 'Dryness', 'Aging', 'Normal', 'Pigmentation'];

// Recommendation Mappings (already defined earlier, keeping them for use)
const hairRecommendations = {
    'Straight-Damaged': { products: hairStraightDamagedProducts, remedies: hairStraightDamagedRemedies },
    'Straight-Dandruff': { products: hairStraightDandruffProducts, remedies: hairStraightDandruffRemedies },
    'Straight-Dry': { products: hairStraightDryProducts, remedies: hairStraightDryRemedies },
    'Straight-Normal': { products: hairStraightNormalProducts, remedies: hairStraightNormalRemedies },
    'Straight-Oily': { products: hairStraightOilyProducts, remedies: hairStraightOilyRemedies },
    'Straight-Thinning': { products: hairStraightThinningProducts, remedies: hairStraightThinningRemedies },
    'Wavy-Damaged': { products: hairWavyDamagedProducts, remedies: hairWavyDamagedRemedies },
    'Wavy-Dandruff': { products: hairWavyDandruffProducts, remedies: hairWavyDandruffRemedies },
    'Wavy-Dry': { products: hairWavyDryProducts, remedies: hairWavyDryRemedies },
    'Wavy-Normal': { products: hairWavyNormalProducts, remedies: hairWavyNormalRemedies },
    'Wavy-Oily': { products: hairWavyOilyProducts, remedies: hairWavyOilyRemedies },
    'Wavy-Thinning': { products: hairWavyThinningProducts, remedies: hairWavyThinningRemedies },
    'Curly-Damaged': { products: hairCurlyDamagedProducts, remedies: hairCurlyDamagedRemedies },
    'Curly-Dandruff': { products: hairCurlyDandruffProducts, remedies: hairCurlyDandruffRemedies },
    'Curly-Dry': { products: hairCurlyDryProducts, remedies: hairCurlyDryRemedies },
    'Curly-Normal': { products: hairCurlyNormalProducts, remedies: hairCurlyNormalRemedies },
    'Curly-Oily': { products: hairCurlyOilyProducts, remedies: hairCurlyOilyRemedies },
    'Curly-Thinning': { products: hairCurlyThinningProducts, remedies: hairCurlyThinningRemedies },
    'Coily-Damaged': { products: hairCoilyDamagedProducts, remedies: hairCoilyDamagedRemedies },
    'Coily-Dandruff': { products: hairCoilyDandruffProducts, remedies: hairCoilyDandruffRemedies },
    'Coily-Dry': { products: hairCoilyDryProducts, remedies: hairCoilyDryRemedies },
    'Coily-Normal': { products: hairCoilyNormalProducts, remedies: hairCoilyNormalRemedies },
    'Coily-Oily': { products: hairCoilyOilyProducts, remedies: hairCoilyOilyRemedies },
    'Coily-Thinning': { products: hairCoilyThinningProducts, remedies: hairCoilyThinningRemedies },
};

const skinRecommendations = {
    'Oily-Acne': { products: skinOilyAcneProducts, remedies: skinOilyAcneRemedies },
    'Oily-Aging': { products: skinOilyAgingProducts, remedies: skinOilyAgingRemedies },
    'Oily-Dryness': { products: skinOilyDrynessProducts, remedies: skinOilyDrynessRemedies },
    'Oily-Normal': { products: skinOilyNormalProducts, remedies: skinOilyNormalRemedies },
    'Oily-Pigmentation': { products: skinOilyPigmentationProducts, remedies: skinOilyPigmentationRemedies },
    'Oily-Redness': { products: skinOilyRednessProducts, remedies: skinOilyRednessRemedies },
    'Dry-Acne': { products: skinDryAcneProducts, remedies: skinDryAcneRemedies },
    'Dry-Aging': { products: skinDryAgingProducts, remedies: skinDryAgingRemedies },
    'Dry-Dryness': { products: skinDryDrynessProducts, remedies: skinDryDrynessRemedies },
    'Dry-Normal': { products: skinDryNormalProducts, remedies: skinDryNormalRemedies },
    'Dry-Pigmentation': { products: skinDryPigmentationProducts, remedies: skinDryPigmentationRemedies },
    'Dry-Redness': { products: skinDryRednessProducts, remedies: skinDryRednessRemedies },
    'Normal-Acne': { products: skinNormalAcneProducts, remedies: skinNormalAcneRemedies },
    'Normal-Aging': { products: skinNormalAgingProducts, remedies: skinNormalAgingRemedies },
    'Normal-Dryness': { products: skinNormalDrynessProducts, remedies: skinNormalDrynessRemedies },
    'Normal-Normal': { products: skinNormalNormalProducts, remedies: skinNormalNormalRemedies },
    'Normal-Pigmentation': { products: skinNormalPigmentationProducts, remedies: skinNormalPigmentationRemedies },
    'Normal-Redness': { products: skinNormalRednessProducts, remedies: skinNormalRednessRemedies },
    'Combination-Acne': { products: skinCombinationAcneProducts, remedies: skinCombinationAcneRemedies },
    'Combination-Aging': { products: skinCombinationAgingProducts, remedies: skinCombinationAgingRemedies },
    'Combination-Dryness': { products: skinCombinationDrynessProducts, remedies: skinCombinationDrynessRemedies },
    'Combination-Normal': { products: skinCombinationNormalProducts, remedies: skinCombinationNormalRemedies },
    'Combination-Pigmentation': { products: skinCombinationPigmentationProducts, remedies: skinCombinationPigmentationRemedies },
    'Combination-Redness': { products: skinCombinationRednessProducts, remedies: skinCombinationRednessRemedies },
    'Sensitive-Acne': { products: skinSensitiveAcneProducts, remedies: skinSensitiveAcneRemedies },
    'Sensitive-Aging': { products: skinSensitiveAgingProducts, remedies: skinSensitiveAgingRemedies },
    'Sensitive-Dryness': { products: skinSensitiveDrynessProducts, remedies: skinSensitiveDrynessRemedies },
    'Sensitive-Normal': { products: skinSensitiveNormalProducts, remedies: skinSensitiveNormalRemedies },
    'Sensitive-Pigmentation': { products: skinSensitivePigmentationProducts, remedies: skinSensitivePigmentationRemedies },
    'Sensitive-Redness': { products: skinSensitiveRednessProducts, remedies: skinSensitiveRednessRemedies },
};

// Recommendation Endpoint with ML Prediction and Mappings
app.post('/recommend', async (req, res) => {
    const { imagePath, category, answers } = req.body;
    console.log(`[${new Date().toISOString()}] Received /recommend request:`, { imagePath, category, answers });

    if (!imagePath || !category) {
        console.log(`[${new Date().toISOString()}] Missing required fields`);
        return res.status(400).json({ success: false, error: 'Image path and category are required' });
    }

    if (!answers || (category === 'hair' && !answers.hairType) || (category === 'skin' && !answers.skinType)) {
        console.log(`[${new Date().toISOString()}] Missing type information in answers`);
        return res.status(400).json({ success: false, error: 'Hair type or skin type is required in answers' });
    }

    const recommendations = { commercial: [], natural: [] };
    let problem;

    try {
        // Get ML Prediction
        console.log(`[${new Date().toISOString()}] Requesting ML prediction`);
        const mlPrediction = await getMLPrediction(imagePath, category);
        let { condition: mlCondition, confidence } = mlPrediction;

        // Ensure mlCondition is one of the allowed conditions
        let finalCondition = mlCondition;
        if (category === 'hair') {
            if (!HAIR_CONDITIONS.includes(mlCondition)) {
                mlCondition = 'Normal';
                confidence = 0.5;
            }
            if (confidence < 0.7 && answers.hairConcern && HAIR_CONDITIONS.includes(answers.hairConcern)) {
                finalCondition = answers.hairConcern;
                console.log(`[${new Date().toISOString()}] Falling back to user-selected concern: ${finalCondition} (ML confidence: ${confidence})`);
            } else {
                console.log(`[${new Date().toISOString()}] Using ML prediction: ${finalCondition} with confidence: ${confidence}`);
            }
        } else if (category === 'skin') {
            if (!SKIN_CONDITIONS.includes(mlCondition)) {
                mlCondition = 'Normal';
                confidence = 0.5;
            }
            if (confidence < 0.7 && answers.skinConcern && SKIN_CONDITIONS.includes(answers.skinConcern)) {
                finalCondition = answers.skinConcern;
                console.log(`[${new Date().toISOString()}] Falling back to user-selected concern: ${finalCondition} (ML confidence: ${confidence})`);
            } else {
                console.log(`[${new Date().toISOString()}] Using ML prediction: ${finalCondition} with confidence: ${confidence}`);
            }
        } else {
            console.log(`[${new Date().toISOString()}] Invalid category: ${category}`);
            return res.status(400).json({ success: false, error: 'Invalid category' });
        }

        // Determine type and problem for mapping
        let type;
        if (category === 'hair') {
            type = answers.hairType; // e.g., Straight, Wavy, Curly, Coily
            // Adjust finalCondition to match mapping keys
            problem = finalCondition === 'Dryness' ? 'Dry' : finalCondition === 'Damage' ? 'Damaged' : finalCondition;
        } else if (category === 'skin') {
            type = answers.skinType; // e.g., Oily, Dry, Normal, Combination, Sensitive
            problem = finalCondition;
        }

        // Use the mappings to get recommendations
        const key = `${type}-${problem}`; // e.g., Straight-Dry
        let recommendationSet;
        if (category === 'hair') {
            recommendationSet = hairRecommendations[key] || hairRecommendations[`${type}-Normal`]; // Fallback to Normal
        } else if (category === 'skin') {
            recommendationSet = skinRecommendations[key] || skinRecommendations[`${type}-Normal`]; // Fallback to Normal
        }

        if (!recommendationSet) {
            console.log(`[${new Date().toISOString()}] No recommendations found for key: ${key}`);
            return res.status(404).json({ success: false, message: 'No recommendations found for the given type and problem' });
        }

        recommendations.commercial = recommendationSet.products || [];
        recommendations.natural = recommendationSet.remedies || [];

        console.log(`[${new Date().toISOString()}] Sending successful response`);
        res.json({ success: true, recommendations, problem, mlPrediction });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in /recommend: ${error.message}`);
        res.status(500).json({ success: false, error: 'Recommendation failed', details: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Server error:`, err);
    res.status(500).json({ success: false, error: 'Server error', details: err.message });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});