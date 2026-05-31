<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Techniciens
        $techs = [
            ['nom'=>'Karim Diallo',  'specialite'=>'Matériel & Réseaux',  'actifs'=>4,'resolus'=>18,'disponibilite'=>60,'statut'=>'Occupé',          'telephone'=>'+225 07 00 11 22'],
            ['nom'=>'Sophie Martin', 'specialite'=>'Logiciel & Systèmes', 'actifs'=>3,'resolus'=>14,'disponibilite'=>75,'statut'=>'Disponible',      'telephone'=>'+225 07 00 33 44'],
            ['nom'=>'Luc Bernard',   'specialite'=>'Réseaux & Sécurité',  'actifs'=>2,'resolus'=>9, 'disponibilite'=>85,'statut'=>'Disponible',      'telephone'=>'+225 07 00 55 66'],
            ['nom'=>'Amara Koné',    'specialite'=>'Électrique & Infra',  'actifs'=>5,'resolus'=>6, 'disponibilite'=>35,'statut'=>'En intervention', 'telephone'=>'+225 07 00 77 88'],
        ];
        foreach ($techs as $t) { DB::table('techniciens')->insert(array_merge($t,['created_at'=>now(),'updated_at'=>now()])); }

        // Clients
        $clients = [
            ['nom'=>'Acme Industries',  'secteur'=>'Industrie','contact'=>'Marc Dupont', 'email'=>'m.dupont@acme.ci',    'telephone'=>'','ville'=>'Abidjan',   'contrat'=>'Actif',  'nb_tickets'=>8],
            ['nom'=>'BTP Solutions',    'secteur'=>'BTP',      'contact'=>'Fatou Bamba', 'email'=>'f.bamba@btp.ci',       'telephone'=>'','ville'=>'Bouaké',    'contrat'=>'Actif',  'nb_tickets'=>5],
            ['nom'=>'Clinique du Nord', 'secteur'=>'Santé',    'contact'=>'Dr. Koné',    'email'=>'admin@clinique.ci',    'telephone'=>'','ville'=>'Abidjan',   'contrat'=>'Expiré', 'nb_tickets'=>3],
            ['nom'=>'DataSoft SA',      'secteur'=>'IT',       'contact'=>'Ali Traoré',  'email'=>'a.traore@datasoft.ci', 'telephone'=>'','ville'=>'Abidjan',   'contrat'=>'Actif',  'nb_tickets'=>12],
            ['nom'=>'Énergie Plus',     'secteur'=>'Énergie',  'contact'=>'Nadia Yao',   'email'=>'n.yao@energie.ci',     'telephone'=>'','ville'=>'San-Pédro', 'contrat'=>'Actif',  'nb_tickets'=>4],
        ];
        foreach ($clients as $c) { DB::table('clients')->insert(array_merge($c,['created_at'=>now(),'updated_at'=>now()])); }

        // IDs
        $acme=1; $btp=2; $clinique=3; $datasoft=4; $energie=5;
        $karim=1; $sophie=2; $luc=3; $amara=4;

        // Tickets
        $tickets = [
            ['reference'=>'TK-042','sujet'=>'Panne serveur principal',       'client_id'=>$acme,     'technicien_id'=>$karim, 'priorite'=>'Urgent', 'statut'=>'En cours','categorie'=>'Matériel',   'date_prevue'=>'2026-05-28'],
            ['reference'=>'TK-041','sujet'=>'Imprimante réseau défaillante',  'client_id'=>$btp,      'technicien_id'=>$sophie,'priorite'=>'Haute',  'statut'=>'En cours','categorie'=>'Matériel',   'date_prevue'=>'2026-05-28'],
            ['reference'=>'TK-040','sujet'=>'Mise à jour logiciel ERP',       'client_id'=>$datasoft, 'technicien_id'=>$luc,   'priorite'=>'Normale','statut'=>'Ouvert',  'categorie'=>'Logiciel',   'date_prevue'=>'2026-05-27'],
            ['reference'=>'TK-039','sujet'=>'Fuite câblage électrique',       'client_id'=>$clinique, 'technicien_id'=>$amara, 'priorite'=>'Urgent', 'statut'=>'En cours','categorie'=>'Électrique', 'date_prevue'=>'2026-05-27'],
            ['reference'=>'TK-038','sujet'=>'Configuration VPN employés',     'client_id'=>$energie,  'technicien_id'=>$sophie,'priorite'=>'Normale','statut'=>'Ouvert',  'categorie'=>'Réseau',     'date_prevue'=>'2026-05-26'],
            ['reference'=>'TK-037','sujet'=>'Écran cassé salle réunion',      'client_id'=>$acme,     'technicien_id'=>$karim, 'priorite'=>'Basse',  'statut'=>'Ouvert',  'categorie'=>'Matériel',   'date_prevue'=>'2026-05-26'],
            ['reference'=>'TK-036','sujet'=>'Sauvegarde données corrompue',   'client_id'=>$datasoft, 'technicien_id'=>$luc,   'priorite'=>'Haute',  'statut'=>'Résolu',  'categorie'=>'Logiciel',   'date_prevue'=>'2026-05-25'],
        ];
        foreach ($tickets as $t) { DB::table('tickets')->insert(array_merge($t,['created_at'=>now(),'updated_at'=>now()])); }

        // Dépannages
        $deps = [
            ['reference'=>'DP-018','description'=>'Onduleur hors service',      'client_id'=>$clinique,'technicien_id'=>$amara, 'equipement'=>'UPS APC 3000VA',   'priorite'=>'Urgent', 'statut'=>'En cours','date_intervention'=>'2026-05-28'],
            ['reference'=>'DP-017','description'=>'PC ne démarre plus',          'client_id'=>$datasoft,'technicien_id'=>$karim, 'equipement'=>'PC Dell OptiPlex', 'priorite'=>'Haute',  'statut'=>'En cours','date_intervention'=>'2026-05-27'],
            ['reference'=>'DP-016','description'=>'Réseau wifi instable',        'client_id'=>$btp,     'technicien_id'=>$luc,   'equipement'=>'Routeur Cisco',    'priorite'=>'Normale','statut'=>'Résolu',  'date_intervention'=>'2026-05-26'],
            ['reference'=>'DP-015','description'=>'Imprimante bourrage papier',  'client_id'=>$acme,    'technicien_id'=>$sophie,'equipement'=>'HP LaserJet Pro',  'priorite'=>'Basse',  'statut'=>'Résolu',  'date_intervention'=>'2026-05-25'],
        ];
        foreach ($deps as $d) { DB::table('depannages')->insert(array_merge($d,['created_at'=>now(),'updated_at'=>now()])); }

        // Installations
        $insts = [
            ['reference'=>'IN-008','titre'=>'Installation serveur NAS',     'client_id'=>$datasoft,'technicien_id'=>$karim, 'equipement'=>'Synology DS923+',    'statut'=>'En cours','date_debut'=>'2026-05-20','date_fin'=>'2026-05-30','avancement'=>70],
            ['reference'=>'IN-007','titre'=>'Câblage réseau bureaux',       'client_id'=>$btp,     'technicien_id'=>$luc,   'equipement'=>'Cat6A + Switch 48p', 'statut'=>'Planifié','date_debut'=>'2026-06-02','date_fin'=>'2026-06-10','avancement'=>0],
            ['reference'=>'IN-006','titre'=>'Climatisation salle serveurs', 'client_id'=>$energie, 'technicien_id'=>$amara, 'equipement'=>'Daikin 24000 BTU',   'statut'=>'Résolu',  'date_debut'=>'2026-05-10','date_fin'=>'2026-05-15','avancement'=>100],
            ['reference'=>'IN-005','titre'=>'Déploiement ERP SAP',          'client_id'=>$acme,    'technicien_id'=>$sophie,'equipement'=>'SAP S/4HANA',        'statut'=>'En cours','date_debut'=>'2026-05-01','date_fin'=>'2026-06-15','avancement'=>45],
        ];
        foreach ($insts as $i) { DB::table('installations')->insert(array_merge($i,['created_at'=>now(),'updated_at'=>now()])); }

        // Contrats
        $contrats = [
            ['reference'=>'CT-2024-018','client_id'=>$acme,     'type_contrat'=>'Maintenance préventive',      'date_debut'=>'2024-01-01','date_fin'=>'2026-12-31','montant'=>'2 400 000','visites_par_an'=>4, 'statut'=>'Actif', 'prochaine_visite'=>'2026-06-15'],
            ['reference'=>'CT-2024-017','client_id'=>$clinique,  'type_contrat'=>'Maintenance corrective 24/7', 'date_debut'=>'2024-03-01','date_fin'=>'2025-02-28','montant'=>'3 600 000','visites_par_an'=>12,'statut'=>'Expiré','prochaine_visite'=>null],
            ['reference'=>'CT-2025-016','client_id'=>$datasoft,  'type_contrat'=>'Contrat global TMA',          'date_debut'=>'2025-01-01','date_fin'=>'2027-12-31','montant'=>'5 100 000','visites_par_an'=>2, 'statut'=>'Actif', 'prochaine_visite'=>'2026-07-01'],
            ['reference'=>'CT-2025-015','client_id'=>$btp,       'type_contrat'=>'Maintenance matériel',        'date_debut'=>'2025-06-01','date_fin'=>'2026-05-31','montant'=>'1 200 000','visites_par_an'=>6, 'statut'=>'Actif', 'prochaine_visite'=>'2026-06-05'],
            ['reference'=>'CT-2025-014','client_id'=>$energie,   'type_contrat'=>'Maintenance réseau',          'date_debut'=>'2025-04-01','date_fin'=>'2026-03-31','montant'=>'960 000',  'visites_par_an'=>3, 'statut'=>'Actif', 'prochaine_visite'=>'2026-06-20'],
        ];
        foreach ($contrats as $c) { DB::table('contrats')->insert(array_merge($c,['created_at'=>now(),'updated_at'=>now()])); }
    }
}
