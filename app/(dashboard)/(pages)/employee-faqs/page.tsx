'use client';

import React, { useState, useEffect } from 'react';
import { Form, InputGroup, Accordion, Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { faqService } from '@/services/faq.service'; 
import { FAQ } from '@/models/hr/hr-models'; 

export default function EmployeeFaqPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const response = await faqService.getAll(); 
                setFaqs(response.data); 
                setLoading(false);
            } catch (err) {
                console.error("SSS verileri çekilirken hata:", err);
                setError("Sorular yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
                setLoading(false);
            }
        };

        fetchFaqs();
    }, []);

    // 1. Sadece 'ACTIVE' olan soruları filtrele
    // 2. Arama kutusuna yazılan kelimeyi 'title' veya 'description' içinde ara
    const filteredFaqs = faqs.filter(faq => 
        faq.status === 'ACTIVE' && (
            faq.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            faq.description.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    return (
        <Container className="p-4">
            <Row className="mb-4">
                <Col>
                    <h2 className="mb-3 text-primary">Sıkça Sorulan Sorular</h2>
                    <p className="text-muted">Aklınıza takılan soruların cevaplarını aşağıda arayabilirsiniz.</p>
                    
                    <InputGroup size="lg">
                        <InputGroup.Text id="search-icon">🔍</InputGroup.Text>
                        <Form.Control
                            placeholder="Bir soru veya kelime arayın..."
                            aria-label="Arama"
                            aria-describedby="search-icon"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </InputGroup>
                </Col>
            </Row>

            <Row>
                <Col>
                    {loading ? (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-3 text-muted">Sorular yükleniyor...</p>
                        </div>
                    ) : error ? (
                        <Alert variant="danger">{error}</Alert>
                    ) : filteredFaqs.length > 0 ? (
                        <Accordion>
                            {filteredFaqs.map((faq, index) => (
                                <Accordion.Item eventKey={index.toString()} key={faq.id}>
                                    <Accordion.Header className="fw-bold">
                                        {faq.title}
                                    </Accordion.Header>
                                    <Accordion.Body>
                                        <div dangerouslySetInnerHTML={{ __html: faq.description }} />
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center p-5 text-muted">
                            <h5>Aramanıza uygun sonuç bulunamadı. 😕</h5>
                        </div>
                    )}
                </Col>
            </Row>
        </Container>
    );
}